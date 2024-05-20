export const muxVideoSchema = {
  name: 'mux.video',
  type: 'object',
  title: 'Video asset reference',
  fields: [
    {
      title: 'Video',
      name: 'asset',
      type: 'reference',
      weak: true,
      to: [{type: 'mux.videoAsset'}],
    },
  ],
}

const muxTrack = {
  name: 'mux.track',
  type: 'object',
  fields: [
    {type: 'string', name: 'id'},
    {type: 'string', name: 'type'},
    {type: 'number', name: 'max_width'},
    {type: 'number', name: 'max_frame_rate'},
    {type: 'number', name: 'duration'},
    {type: 'number', name: 'max_height'},
  ],
}

const muxPlaybackId = {
  name: 'mux.playbackId',
  type: 'object',
  fields: [
    {type: 'string', name: 'id'},
    {type: 'string', name: 'policy'},
  ],
}

const muxStaticRenditionFile = {
  name: 'mux.staticRenditionFile',
  type: 'object',
  fields: [
    {type: 'string', name: 'ext'},
    {type: 'string', name: 'name'},
    {type: 'number', name: 'width'},
    {type: 'number', name: 'bitrate'},
    {type: 'number', name: 'filesize'},
    {type: 'number', name: 'height'},
  ],
}

const muxStaticRenditions = {
  name: 'mux.staticRenditions',
  type: 'object',
  fields: [
    {type: 'string', name: 'status'},
    {
      name: 'files',
      type: 'array',
      of: [{type: 'mux.staticRenditionFile'}],
    },
  ],
}

const muxAssetData = {
  name: 'mux.assetData',
  title: 'Mux asset data',
  type: 'object',
  fields: [
    {
      type: 'string',
      name: 'resolution_tier',
    },
    {
      type: 'string',
      name: 'upload_id',
    },
    {
      type: 'string',
      name: 'created_at',
    },
    {
      type: 'string',
      name: 'id',
    },
    {
      type: 'string',
      name: 'status',
    },
    {
      type: 'string',
      name: 'max_stored_resolution',
    },
    {
      type: 'string',
      name: 'passthrough',
    },
    {
      type: 'string',
      name: 'encoding_tier',
    },
    {
      type: 'string',
      name: 'master_access',
    },
    {
      type: 'string',
      name: 'aspect_ratio',
    },
    {
      type: 'number',
      name: 'duration',
    },
    {
      type: 'number',
      name: 'max_stored_frame_rate',
    },
    {
      type: 'string',
      name: 'mp4_support',
    },
    {
      type: 'string',
      name: 'max_resolution_tier',
    },
    {
      name: 'tracks',
      type: 'array',
      of: [{type: 'mux.track'}],
    },
    {
      name: 'playback_ids',
      type: 'array',
      of: [{type: 'mux.playbackId'}],
    },
    {
      name: 'static_renditions',
      type: 'mux.staticRenditions',
    },
  ],
}

const muxVideoAsset = {
  name: 'mux.videoAsset',
  type: 'object',
  title: 'Video asset',
  fields: [
    {
      type: 'string',
      name: 'status',
    },
    {
      type: 'string',
      name: 'assetId',
    },
    {
      type: 'string',
      name: 'playbackId',
    },
    {
      type: 'string',
      name: 'filename',
    },
    {
      type: 'number',
      name: 'thumbTime',
    },
    {
      type: 'mux.assetData',
      name: 'data',
    },
  ],
}

export const schemaTypes = [
  muxTrack,
  muxPlaybackId,
  muxStaticRenditionFile,
  muxStaticRenditions,
  muxAssetData,
  muxVideoAsset,
]
