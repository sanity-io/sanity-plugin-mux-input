# Mux Video Input Sanity Plugin

This is a plugin which let you use [MUX.com](https://www.mux.com  ) video assets in your Sanity studio.

The Mux plugin for Sanity gives you a way to upload and preview videos easily.

[Read our blog post](https://www.sanity.io/blog/first-class-responsive-video-support-with-the-new-mux-plugin) about this plugin.

Not familiar with Sanity? [Visit www.sanity.io](https://www.sanity.io/)

## Quick start

* While in your project folder, run ``sanity install mux-input``.
  Read more about [using plugins in Sanity here](https://www.sanity.io/docs/plugins).


* Make a schema type that uses the plugin's type ``mux.video``, for example:

  ```
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


* Get an API Access Token and enter it into the setup screen
  First time you use the plugin you will be asked to enter your MUX credentials.

  The Mux Video API uses an Access Token and Secret Key for authentication.

  If you haven't already, generate a new Access Token in the Access Token settings of your Mux account dashboard, and make sure it got permission to both read and write *video* and read *data*.

  The token is stored in the dataset as a document of the type ``mux.apiKey`` with the id ``secrets.mux``.
  Having the ID be non-root ensures that only editors are able to see it.

  The MUX plugin will find it’s access tokens by fetching this document.


# Playing videos in the frontend

We have made an own player which supports poster images for the videos as set with this plugin, see [`sanity-mux-player`](https://github.com/sanity-io/sanity-mux-player)

You could use any player which supports HLS, just point the video source to:

`https://stream.mux.com/${assetDocument.playbackId}.m3u8`
