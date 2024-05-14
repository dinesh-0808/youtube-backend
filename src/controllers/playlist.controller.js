import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
  if (!name) {
    throw new ApiError(404, "name not found for playlist");
  }

  const playlist = await Playlist.create({
    name,
    description: description || "",
    videos: [],
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "playlist not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(404, "userId not found");
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "INVALID USERiD");
  }

  const userPlaylists = await Playlist.find({
    owner: userId,
  });
  if (!userPlaylists) {
    throw new ApiError(404, "no playlist found for the userId");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId) {
    throw new ApiError(404, "playlist not found");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !videoId) {
    throw new ApiError(404, "playlistId or videoId not found");
  }
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlist or video id ");
  }

  const playlist = await Playlist.findById(playlistId);

  if (playlist.owner?.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "not authorised to add video to playlist");
  }

  const video = await Video.findById(videoId);
  const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId, {
    $push: {
      videos: video,
    },
  });
  if (!updatePlaylist) {
    throw new ApiError(404, "no playlist found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylist, "video added successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!playlistId || !videoId) {
    throw new ApiError(404, "playlistId or videoId not found");
  }
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid playlist or video id ");
  }

  const playlist = await Playlist.findById(playlistId);

  if (playlist.owner?.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "not authorised to delete video from playlist");
  }
  const video = await Video.findById(videoId);
  const deleteVideoFromPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: new mongoose.Types.ObjectId(video),
      },
    },
    { new: true }
  );

  if (!deleteVideoFromPlaylist) {
    throw new ApiError(404, "playlist not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deleteVideoFromPlaylist,
        "video deleted successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(404, "playlist not found");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid playlistId");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new ApiError(404, "no playlist found to delete");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: update playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "Please provide a name and description");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true }
  );
  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
