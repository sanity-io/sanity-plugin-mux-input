# Mux Video Input Sanity Plugin

This is a plugin which let you use [Mux](https://www.mux.com) video assets in your Sanity studio.

The Mux plugin for Sanity gives you a way to upload and preview videos easily.

[Read our blog post](https://www.sanity.io/blog/first-class-responsive-video-support-with-the-new-mux-plugin) about this plugin.

Not familiar with Sanity? [Visit www.sanity.io](https://www.sanity.io/)

## Quick start

- While in your project folder, run `sanity install mux-input`.
  Read more about [using plugins in Sanity here](https://www.sanity.io/docs/plugins).

* Make a schema type that uses the plugin's type `mux.video`, for example:

  ```js
  {
    title: "Video blog post",
    name: "videoBlogPost",
    type: "document",
    fields: [
      { title: "Title", name: "title", type: "string" },
      {
        title: "Video file",
        name: "video",
        type: "mux.video"
      }
    ]
  }
  ```

  Read more about [schemas in Sanity here](https://www.sanity.io/docs/the-schema).

- Get an API Access Token and enter it into the setup screen
  First time you use the plugin you will be asked to enter your Mux credentials.

  The Mux Video API uses an Access Token and Secret Key for authentication.

  If you haven't already, generate a new Access Token in the Access Token settings of your Mux account dashboard, and make sure it got permission to both read and write _video_ and read _data_.

  The token is stored in the dataset as a document of the type `mux.apiKey` with the id `secrets.mux`.
  Having the ID be non-root ensures that only editors are able to see it.

  The Mux plugin will find it’s access tokens by fetching this document.

# Playing videos in the frontend

We have made an own player which supports poster images for the videos as set with this plugin, see [`sanity-mux-player`](https://github.com/sanity-io/sanity-mux-player)

You could use any player which supports HLS, just point the video source to:

`https://stream.mux.com/${assetDocument.playbackId}.m3u8`

# Enabling Signed Urls

To enable [signed urls](https://docs.mux.com/docs/security-signed-urls) with content uploaded to Mux, you will need to check the "Enable Signed Urls" option in the Mux Plugin configuration. Assuming that the API Access Token and Secret Key are set (as per the [Quick start](#quick-start) section).

More information for this feature of the plugin can be found on Mux's [documentation](https://docs.mux.com/docs/headless-cms-sanity#advanced-signed-urls)

# Contributing

Issues are actively monitored and PRs are welcome. When developing this plugin the easiest setup is:

1. Fork this repo.
1. Install the sanity cli and create a sanity project: `npm install -g @sanity/cli && sanity init`. Follow the prompts, starting out with the blog template is a good way to go.
1. `cd` into your project directory, run `npm install && npm start` - your sanity studio should be running on http://localhost:3333.
1. `cd` into the `plugins` director of your project.
1. Fork this repo and clone your fork into the `plugins` directory inside your project `git clone git@github.com:your-fork/sanity-plugin-mux-input.git`.
1. Open `sanity.json`, go to the `plugins` array and add `mux-input`.
1. Re-start the sanity studio server with `npm start`.
1. Edit `schemas/post.js` and add follow the plugin documentation to add a `mux.video` type field.
1. Your studio should reload, and now when you edit the plugin code it should reload the studio, when you're done create a branch, put in a PR and a maintainer will review it. Thank you!
