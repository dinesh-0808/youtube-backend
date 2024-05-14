import mongoose, { isValidObjectId } from "mongoose";
import { Like, Video } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) {
    throw new ApiError(404, "pls enter videoId");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "invalid videoId");
  }

  const getVideo = await Video.findById(videoId);

  if (!(getVideo && getVideo.isPublished)) {
    throw new ApiError(404, "video not found");
  }

  const alreadyLiked = await Like.findOne({
    video: videoId,
    user: req.user._id,
  });

  if (alreadyLiked && alreadyLiked.length > 0) {
    await Like.findByIdAndDelete(alreadyLiked._id, { new: true });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Video was already liked, so Video disliked successfully"
        )
      );
  }
  const newLike = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });
  if (!newLike) {
    throw new ApiError(500, "Not able to like the video");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, { like: newLike }, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
