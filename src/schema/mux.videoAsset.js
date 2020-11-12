export default {
  name: 'mux.videoAsset',
  type: 'document',
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
    }
  ]
}
