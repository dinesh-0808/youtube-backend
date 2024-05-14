import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  //const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(404, "videoId not entered");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "invalid videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const comments = await Comment.find({
    video: video,
  });

  if (!comments) {
    throw new ApiError(404, "comments not found for the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "videoId not entered");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "invalid videoId");
  }
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "please provide a comment");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const comment = await Comment.create({
    content: content,
    video: new mongoose.Types.ObjectId(video._id),
    owner: new mongoose.Types.ObjectId(req.user?._id),
  });
  if (!comment) {
    throw new ApiError(500, "comment not published");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment published successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const { commentId } = req.params;
  if (!comment) {
    throw new ApiError(404, "pls provide comment ");
  }

  if (!commentId) {
    throw new ApiError(404, "comment not found");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, "invalid commetId");
  }

  const userId = req.user?._id;

  const getComment = await Comment.findById(commentId);
  if (!getComment) {
    throw new ApiError(404, "comment not found");
  }
  if (userId.toString() !== getComment.owner.toString()) {
    throw new ApiError(401, "you are not allowed to edit the comment");
  }

  const newComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: comment,
      },
    },
    { new: true }
  );
  if (!newComment) {
    throw new ApiError(404, "comment not updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(404, "comment not found");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, "invalid commetId");
  }

  const userId = req.user?._id;

  const getComment = await Comment.findById(commentId);
  if (!getComment) {
    throw new ApiError(404, "comment not found");
  }
  if (userId.toString() !== getComment.owner.toString()) {
    throw new ApiError(401, "you are not allowed to delete the comment");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId);

  if (!deleteComment) {
    throw new ApiError(404, "comment not deleted");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
