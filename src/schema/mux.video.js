import Input from '../components/Input'

export default {
  name: 'mux.video',
  type: 'object',
  title: 'Video asset reference',
  fields: [
    {
      title: 'Video',
      name: 'asset',
      type: 'reference',
      to: [{type: 'mux.videoAsset'}]
    }
  ],
  inputComponent: Input
}
