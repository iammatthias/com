```
      :::::::::::     :::       :::   :::     :::   :::       ::: ::::::::::: ::::::::::: :::    ::: :::::::::::     :::      ::::::::
         :+:       :+: :+:    :+:+: :+:+:   :+:+: :+:+:    :+: :+:   :+:         :+:     :+:    :+:     :+:       :+: :+:   :+:    :+:
        +:+      +:+   +:+  +:+ +:+:+ +:+ +:+ +:+:+ +:+  +:+   +:+  +:+         +:+     +:+    +:+     +:+      +:+   +:+  +:+
       +#+     +#++:++#++: +#+  +:+  +#+ +#+  +:+  +#+ +#++:++#++: +#+         +#+     +#++:++#++     +#+     +#++:++#++: +#++:++#++
      +#+     +#+     +#+ +#+       +#+ +#+       +#+ +#+     +#+ +#+         +#+     +#+    +#+     +#+     +#+     +#+        +#+
     #+#     #+#     #+# #+#       #+# #+#       #+# #+#     #+# #+#         #+#     #+#    #+#     #+#     #+#     #+# #+#    #+#
########### ###     ### ###       ### ###       ### ###     ### ###         ###     ###    ### ########### ###     ###  ########
```

### hi

After a few years on NextJS with various content backends (Contentful, Hygraph, Sanity, Tina, etc.), I've embraced a new approach.

The front-end is built with [Astro](https://astro.build/), and the content is authored in [Obsidian](https://obsidian.md/). The markdown files are stored in a private repo on Github, and pulled into the Astro site through the Github GraphQL API.

Images that are added to the markdown in Obsidian are uploaded to a [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) bucket, and the URLs are replaced in the markdown files. In Astro, these images are optimized and cached through [WSRV](https://wsrv.nl/).

The site is hosted on [Vercel](https://vercel.com/), and I'm using [PostHog](https://posthog.com/) for some basic analytics.

> The code is provided as-is, and I'm not planning to provide support for this setup. Feel free to use it as inspiration for your own projects.

### built with

- [Astro](https://astro.build/)
- [Obsidian](https://obsidian.md/)
- [PostHog](https://posthog.com/)
- [Vercel](https://vercel.com/)
- [WSRV](https://wsrv.nl/)
- [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)
