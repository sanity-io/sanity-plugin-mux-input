export default {
  name: 'mux.videoAsset',
  type: 'object',
  title: 'Video asset',
  fields: [
    {
      type: 'string',
      name: 'status'
    },
    {
      type: 'string',
      name: 'assetId'
    },
    {
      type: 'string',
      name: 'playbackId'
    },
    {
      type: 'string',
      name: 'filename'
    },
    {
      type: 'number',
      name: 'thumbTime'
    },
    {
      type: 'string',
      name: 'mp4Support'
    },
    {
      type: 'string',
      name: 'mp4SupportStatus'
    },
    {
      type: 'array',
      name: 'mp4Files',
      of: [{type: 'string'}]
    }
  ]
}
