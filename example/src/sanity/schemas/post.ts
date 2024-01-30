import {defineField} from 'sanity'

export default {
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      validation: (Rule) => Rule.required(),
      options: {source: 'title'},
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'mux.video',
      validation: (Rule) => Rule.required(),
    }),
  ],
}
