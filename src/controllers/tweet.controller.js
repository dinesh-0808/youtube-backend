import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const user_id = req.user?._id;
  console.log("contet: ", content);
  if (!content) {
    throw new ApiError(401, "no content passed");
  }

  const tweet = await Tweet.create({
    content,
    owner: user_id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "invalid userId for tweets");
  }

  const tweets = await User.findById(userId);

  if (!tweets) {
    throw new ApiError(404, "no tweets found");
  }
  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        content: 1,
      },
    },
  ]);

  if (!userTweets) {
    throw new ApiError(404, "No tweets found");
  }
  return res.status(200).json(new ApiResponse(200, userTweets, "tweets found"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(404, "tweetId invalid");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  if (tweet.owner?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(401, "you are not authorised to updated this tweet");
  }

  try {
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content: content,
        },
      },
      { new: true }
    );

    if (!updatedTweet) {
      throw new ApiError(500, "error occured while updating tweet");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { updateTweet }, "tweet updated successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error,
      "An error occurred while trying to update a tweet"
    );
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "improper tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "tweet does not exist");
  }

  if (tweet.owner?.toString() !== req.user?._id?.toString()) {
    throw new ApiError(401, "you are not authorised to delete this tweet");
  }
  try {
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId, {
      new: true,
    });
    if (!deletedTweet) {
      throw new ApiError(500, "tweet not deleted");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "tweet deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error, "tweet not deleted");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
