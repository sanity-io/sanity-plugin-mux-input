# Mux Video Input Sanity Plugin

> This is a **Sanity Studio v3** plugin.
> For the v2 version, please refer to the [v2-branch](https://github.com/sanity-io/sanity-plugin-mux-input/tree/studio-v2).

This plugin lets you use [Mux](https://www.mux.com) video assets in your Sanity studio.

The Mux plugin for Sanity allows you to easily upload and preview videos.

[Read our blog post](https://www.sanity.io/blog/video-management-with-mux) about this plugin.

Not familiar with Sanity? [Visit www.sanity.io](https://www.sanity.io/)

<img width="623" alt="" src="https://github.com/sanity-io/sanity/assets/81981/7a9de462-746b-4c01-8b12-c55f0cbf6334">

## Installation

```
npm install sanity-plugin-mux-input
```

or

```
yarn add sanity-plugin-mux-input
```

## Quick start

- While in your project folder, run `npm i sanity-plugin-mux-input`.
  Read more about [using plugins in Sanity here](https://beta.sanity.io/docs/platform/studio/plugin).

* Make a schema type that uses the plugin's type `mux.video`, for example:

  ```js
  export default {
    title: 'Video blog post',
    name: 'videoBlogPost',
    type: 'document',
    fields: [
      {title: 'Title', name: 'title', type: 'string'},
      {
        title: 'Video file',
        name: 'video',
        type: 'mux.video',
      },
    ],
  }
  ```

  - Add the `muxInput` import to your plugins:

  ```js
  import {defineConfig} from 'sanity'
  import {muxInput} from 'sanity-plugin-mux-input'

  export default defineConfig({
    plugins: [muxInput()],
  })
  ```

Read more about [schemas in Sanity here](https://www.sanity.io/docs/the-schema).

- Get an API Access Token and enter it into the setup screen
  First time you use the plugin you will be asked to enter your Mux credentials.

The Mux Video API uses an Access Token and Secret Key for authentication.

If you haven't already, generate a new Access Token in the Access Token settings of your Mux account dashboard, and make sure it got permission to both read and write _video_ and read _data_.

The token is stored in the dataset as a document of the type `mux.apiKey` with the id `secrets.mux`.
Having the ID be non-root ensures that only editors are able to see it.

The Mux plugin will find its access tokens by fetching this document.

## Fetching playback IDs and understanding the data structure

When a Mux video is uploaded/chosen in a document via this plugin, it gets stored as a reference to the video document:

```json5
// example document
{
  _type: 'exampleSchemaWithVideo',
  // Example video field
  myVideoField: {
    _type: 'mux.video',
    asset: {
      _type: 'reference',
      _weak: true,
      _ref: '4e37284e-cec2-406d-973c-fdf9ab1e5598', // 👈 ID of the document holding the video's Mux data
    },
  },
}
```

Before you can display videos in your frontend, you need to follow these references to fetch the asset's playback ID, which will be used to create a player. Here's an example GROQ query to expand the video reference in the example data above:

```groq
// Example for fetching data above
*[ _type == "exampleSchemaWithVideo" ] {
  myVideoField {
    asset-> {
      playbackId,
      assetId,
      filename,
    }
  }
}
```

💡 For more information on querying references, refer to the documentation on [Writing GROQ queries for references](https://www.sanity.io/docs/reference-type#96b949753900) or on [Sanity's GraphQL API](https://www.sanity.io/docs/graphql).

For reference, here's an example `mux.videoAsset` document:

```json5
{
  _id: '4e37284e-cec2-406d-973c-fdf9ab1e5598',
  _type: 'mux.videoAsset',
  assetId: '7ovyI76F92n02H00mWP7lOCZMIU00N4iysDiQDNppX026HY',
  filename: 'mux-example-video.mp4',
  status: 'ready',
  playbackId: 'YA02HBpY02fKWHDRMNilo301pdH02LY3k9HTcK43ItGJLWA',
  thumbTime: 65.82,
  // Full Mux asset data:
  data: {
    encoding_tier: 'smart',
    max_resolution_tier: '1080p',
    aspect_ratio: '16:9',
    created_at: '1706645034',
    duration: 25.492133,
    status: 'ready',
    master_access: 'none',
    max_stored_frame_rate: 29.97,
    playback_ids: [
      {
        id: 'YA02HBpY02fKWHDRMNilo301pdH02LY3k9HTcK43ItGJLWA',
        policy: 'signed',
      },
    ],
    resolution_tier: '1080p',
    ingest_type: 'on_demand_url',
    max_stored_resolution: 'HD',
    tracks: [
      {
        max_channel_layout: 'stereo',
        max_channels: 2,
        id: '00MKMC73SYimw1YTh0102lPJJp9w2R5rHddpNX1N9opAMk',
        type: 'audio',
        primary: true,
        duration: 25.45,
      },
      {
        max_frame_rate: 29.97,
        max_height: 1080,
        id: 'g1wEph3CVvbJL01YNKzAWMyH8N1SxW00WeECGjqwEHW9g',
        type: 'video',
        duration: 25.4254,
        max_width: 1920,
      },
    ],
    id: '7ovyI76F92n02H00mWP7lOCZMIU00N4iysDiQDNppX026HY',
    mp4_support: 'none',
  },
}
```

## Playing videos in the frontend

We recommend using [Mux Player](https://www.mux.com/player) to properly display your videos, through packages like `@mux/mux-player` and `@mux/mux-player-react`. Here's an example of how you can use the Mux Player to display a video in a React component:

```tsx
'use client'

import MuxPlayer from '@mux/mux-player-react'

export default function MuxVideo({playbackId, title}: {playbackId?: string; title?: string}) {
  if (!playbackId) return null

  return <MuxPlayer playbackId={playbackId} metadata={title ? {video_title: title} : undefined} />
}
```

💡 You can try these recommendations through the [Codesandbox example](https://codesandbox.io/s/github/sanity-io/sanity-plugin-mux-input/tree/main/example).

## Configuring Mux Video uploads

### Signed URLs (private playbacks)

To enable [signed URLs](https://docs.mux.com/docs/security-signed-urls) with content uploaded to Mux, you will need to check the "Enable Signed Urls" option in the Mux Plugin configuration. This feature requires you to set the API Access Token and Secret Key (as per the [Quick start](#quick-start) section).

⚠️ **Important:** To use Signed URLs, the API Access Token must have **System permissions**. Without these permissions, the signing key cannot be created, and authentication will fail.

📌 **Note**: When the signed URL option is triggered, the plugin will cache a `signingKeyPrivate` in a private document in the dataset. This key is used by Mux to sign the uploads, and if it's incorrect your uploads will fail. If that's the case, you can delete the secrets document and try again:

```bash
# Using the Sanity CLI, delete the secrets, then re-open the plugin and configure it again
sanity documents delete secrets.mux
```

More information on signed URLs is available on Mux's [docs](https://docs.mux.com/docs/headless-cms-sanity#advanced-signed-urls)

### MP4 support (downloadable videos or offline viewing)

To enable [static MP4 renditions](https://docs.mux.com/guides/video/enable-static-mp4-renditions), add `mp4_support: 'standard'` to the `options` of your `mux.video` schema type.

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [muxInput({mp4_support: 'standard'})],
})
```

If MP4 support is enabled in the plugin's configuration, editors can still choose to enable MP4 renditions on a per-video basis when uploading new assets.

MP4 allows users to download videos for later or offline viewing. More information can be found on Mux's [documentation](https://docs.mux.com/guides/enable-static-mp4-renditions).

### Video resolution (max_resolution_tier)

To edit [max_resolution_tier](https://docs.mux.com/api-reference#video/operation/create-direct-upload) to support other resolutions other than 1080p, add `max_resolution_tier: '1080p' | '1440p' | '2160p'` to the `options` of your `mux.video` schema type. Defaults to `1080p`.

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [muxInput({max_resolution_tier: '2160p'})],
})
```

When uploading new assets, editors can still choose a lower resolution for each video than configured globally. This option controls the maximum resolution encoded or processed for the uploaded video. The option is particularly important to manage costs when uploaded videos are higher than `1080p` resolution. More information on the feature is available on Mux's [docs](https://docs.mux.com/guides/stream-videos-in-4k). Also, read more on this feature announcement on Mux's [blog](https://www.mux.com/blog/more-pixels-fewer-problems-introducing-4k-support-for-mux-video).

### Encoding tier (smart or baseline)

The [encoding tier](https://docs.mux.com/guides/use-encoding-tiers) informs the cost, quality, and available platform features for the asset. You can choose between `smart` and `baseline` at the plugin configuration. Defaults to `smart`.

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [muxInput({encoding_tier: 'baseline'})],
})
```

If `encoding_tier: 'smart'`, editors can still choose to use the `baseline` encoding tier on a per-video basis when uploading new assets.

More information on the feature is available on Mux's [documentation](https://docs.mux.com/guides/use-encoding-tiers). Also, read more on the feature announcement on Mux's [blog](https://www.mux.com/blog/our-next-pricing-lever-baseline-on-demand-assets-with-free-video-encoding)

### Auto-generated subtitles and captions

If you've enabled smart encoding, you can use Mux's [auto-generated subtitles](https://docs.mux.com/guides/video/auto-generated-subtitles) feature. Unless you pass `disableTextTrackConfig: true` to the configuration, users will be able to choose a language to auto-generate subtitles for uploaded videos. Refer to Mux's documentation for the list of supported languages.

You can also define a default language for the upload configuration form:

```js
import {muxInput} from 'sanity-plugin-mux-input'

export default defineConfig({
  plugins: [
    muxInput({
      encoding_tier: 'smart',
      defaultAutogeneratedSubtitleLang: 'en', // choose from one of the supported languages
    }),
  ],
})
```

If your videos are always spoken in a specific language and you want to include captions by default, you can use `disableTextTrackConfig: true` together with `defaultAutogeneratedSubtitleLang` to transcribe captions for every uploaded asset without needing user interaction.

## Contributing

Issues are actively monitored and PRs are welcome. When developing this plugin the easiest setup is:

1. Fork this repo.
1. Create a studio v3 project: `npm create sanity@dev-preview`. Follow the prompts, starting out with the blog template is a good way to go.
1. `cd` into your project directory, run `npm install && npm start` - your sanity studio should be running on http://localhost:3333.
1. `cd` into the `plugins` directory of your project.
1. Fork this repo and clone your fork into the `plugins` directory inside your project `git clone git@github.com:your-fork/sanity-plugin-mux-input.git`.
1. Open `sanity.json`, go to the `plugins` array and add `mux-input`.
1. Re-start the sanity studio server with `npm start`.
1. Edit `schemas/post.js` and add follow the plugin documentation to add a `mux.video` type field.
1. Your studio should reload, and now when you edit the plugin code it should reload the studio, when you're done creating a branch, put in a PR and a maintainer will review it. Thank you!

### Publishing

You can run the ["CI and Release" workflow](<[https://github.com/sanity-io/sanity-plugin-mux-input/actions/workflows/ci.yml](https://github.com/sanity-io/sanity-plugin-mux-input/actions/workflows/main.yml)>).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

On the [studio-v2](/tree/studio-v2) branch this will result in:

- a new version on the `latest` dist-tag.
- running `yarn add sanity-plugin-mux-input` or `npm i sanity-plugin-mux-input` will fetch the new version.
- running `sanity install mux-input` will fetch the new version.
- studio-v3 users are unaffected.

On the [main](/tree/main) branch this will result in:

- a new prerelease version on the `studio-v3` dist-tag.
- running `yarn add sanity-plugin-mux-input@studio-v3` or `npm i sanity-plugin-mux-input@studio-v3` will fetch the new version.
- running `sanity install mux-input` won't fetch the new version.

After Studio v3 turns stable this behavior will change. The v2 version will then be available on the `studio-v2` dist-tag, and `studio-v3` is upgraded to live on `latest`.

### Develop & test

You can run the example locally by doing the following:

1. run `npm install` and `npm dev` on the root of the repo
2. In the terminal, a command with `yalc` will be shown, that command will allow you to run the version that you have locally directly on the example or on your own app.
3. run `npm install` and `npm dev` on the `/example` directory where the app with the example exists or in your own app
4. the studio and app should auto reload with your changes in the plugin package you have locally

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-plugin-mux-input/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

## License

MIT-licensed. See LICENSE.
