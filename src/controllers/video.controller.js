import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  if (!userId) {
    throw new ApiError(400, "Please provide a userId");
  }
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  console.log("get all videos testing");
  const pipeline = [];
  await User.findById(userId);
  if (userId) {
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  if (query) {
    pipeline.push({
      $match: {
        title: {
          $regex: query,
        },
        isPublished: true,
        // $options: options,
      },
    });
  }
  let createField = {};
  if (sortBy && sortType) {
    createField[sortBy] = sortType;
    pipeline.push({
      $sort: createField,
    });
  } else {
    pipeline.push({
      $sort: {
        createdAt: -1,
      },
    });
  }

  pipeline.push({
    $skip: (options.page - 1) * options.limit,
  });

  pipeline.push({
    $limit: options.limit,
  });
  // pipeline.push({
  //   $match: {
  //     isPublished: true,
  //   },
  // });

  const allVideos = await Video.aggregate(pipeline);
  if (!allVideos) {
    throw new ApiError(404, "No videos found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { allVideos },
        `Total ${allVideos.length} videos found successfully`
      )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  const { title, description } = req.body;
  if (!title) {
    throw new ApiError(404, "title not found");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(404, "video or thumbnail is required");
  }

  // upload on cloudinary
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile || !thumbnail) {
    throw new ApiError(404, "video or thumbnail is required");
  }

  const video = await Video.create({
    title,
    description,
    owner: req.user?._id,
    views: 0,
    videoFile: videoFile?.url,
    thumbnail: thumbnail?.url,
    duration: videoFile.duration,
  });
  return res
    .status(200)
    .json(new ApiResponse(20, { video }, "video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video id is not valid");
  }

  try {
    const isVideo = await Video.findById(videoId);

    if (!isVideo) {
      throw new ApiError(404, "video not found");
    }
    if (isVideo.isPublished === false) {
      throw new ApiError(400, "Video not published");
    }
    console.log(isVideo);
    return res
      .status(200)
      .json(new ApiResponse(200, { isVideo }, "video fetched successfully!!"));
  } catch (error) {
    throw new ApiError(500, error, "video not fetched");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    throw new ApiError(400, "Please provide a video id");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id");
  }
  const { title, description } = req.body;
  const thumbnail = req.file?.path;
  if (!title || !description) {
    throw new ApiError(400, "Please provide a title and description");
  }
  //console.log("thumbnail:", thumbnail);
  if (!thumbnail) {
    throw new ApiError(400, "Please provide a thumbnail");
  }

  const myVideo = await Video.findById(videoId);
  if (!myVideo) {
    throw new ApiError(404, "video not found");
  }

  const updatedThumbnail = await uploadOnCloudinary(thumbnail);
  console.log(myVideo.thumbnail);
  const oldThumbnailDeleted = await deleteOnCloudinary(myVideo?.thumbnail);

  const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: updatedThumbnail?.url,
      },
    },
    {
      new: true,
    }
  );

  if (!updateVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { updateVideo },
        "video details updated successfully"
      )
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Please provide a video id");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video does not exist");
  }

  const deleteThumbnail = await deleteOnCloudinary(video?.thumbnail);
  const deleteVideo = await deleteOnCloudinary(video?.videoFile);

  const deletedVideoDetails = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedVideoDetails },
        "video details deleted successfully"
      )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Please provide a video id");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const videoExist = await Video.findById(videoId);
  if (!videoExist) {
    throw new ApiError(404, "video not found");
  }
  if (videoExist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }
  const togglePublish = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !videoExist.isPublished,
      },
    },
    { new: true }
  );
  if (!togglePublish) {
    throw new ApiError(404, "Video not found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { togglePublish },
        "video publish status updated successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
