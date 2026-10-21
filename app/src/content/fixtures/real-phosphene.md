---
title: "Phosphene"
section: art
description: "A camera that turns each photo into a poem, then paints a new image from those words."
tags: ["ai", "generative", "photography", "apple-intelligence", "on-device", "ios", "image-to-image", "creative-process", "claude-code"]
published: 2026-06-18T21:00:28Z
updated: 2026-07-16T16:53:01Z
cid: bafkreib4yothgbhazbxivjfeuiyxktnb5bk4mbx7fg5j4rvy6utewjql4q
html: https://iammatthias.com/art/1781816428977-phosphene
---

# Phosphene

# Phosphene

Phosphene shoots a photo, writes a poem, then generates an image. The output is a triptych: the original frame, the poem, and the generated image, side by side. The image model only sees the poem and the sensors, never the photo it's reinterpreting.

I built the first version from my phone, in bed, the night the idea showed up. SSH into the laptop, tmux, a Claude Code instance running with a `/goal`. By morning I had an app.

Two other projects I've seen come close. Poetry Camera, by Kelin Carolyn Zhang and Ryan Mather, shoots a frame and prints a poem on a thermal printer, no image kept. Paragraphica, by Bjørn Karmann, drops the lens and builds a picture out of location, weather, and time.

Each of those picks one direction. Phosphene does the whole loop and keeps all three pieces: the frame, the poem it compresses to, and the image a model dreams back out from that poem and the sensors. I built it for the drift between the first panel and the last.

That's where the name comes from. A phosphene is the light you see with your eyes shut, the optic nerve firing with nothing in front of it. The third panel is the phosphene, a place the model never saw, only read about in a poem. The first panel is what was actually there.

The capture and the poem run on-device, on an iPhone 17 Pro Max, on Apple's foundation models from WWDC 2026. There is no API for that part, where Poetry Camera and Paragraphica both reach out to one. The image is the exception: it's painted on Apple's Private Cloud Compute, which needs a connection. So with no signal Phosphene still shoots and writes the poem on the spot, then paints the image later, once service comes back. Mostly local. That's the version I want.

Right now it's not good. The poems are trite. The generated images look like stock slop. But it's fun anyway, and I'm not done with it. I might open the repo if anyone wants to build their own.

![](https://blobs.farfield.systems/blobs/bafkreifvgfs3s3nac4nfgmplagbhud2yzauj5gvfdpwr4wgmducn6xcouq)

> The high pines drag their needles across a sharp blue sky.
> In the clearing, the wooden stage sits heavy in the shade—
> all this timber gathered to hold a crowd,
> and the forest is the only thing looking down.
>
> *clear daylight from the west, overcast, heavy grey sky*

![](https://blobs.farfield.systems/blobs/bafkreiavvwfjgkzycmpjq7nwy4k6emexihbans65nu7reveu5hk2but2im)

![](https://blobs.farfield.systems/blobs/bafkreicjmwp3zj3nogwn4fsqvwrzwb7yuv4vzjari5qhp3usw3rxkx336m)

> The wind shatters the noon into a million flashing coins.
> At the rim, the dark pines refuse the bribe.
> High up, a single scrap of cloud
> forgets what it came to spill.
>
> *harsh overhead light, short shadows, thin clear mountain air, sharp distance, overcast, heavy grey sky*

![](https://blobs.farfield.systems/blobs/bafkreif2rojumsxo4kpvupdn4u7bvefs6ls6qplctur62ipxnybl24byhu)

![](https://blobs.farfield.systems/blobs/bafkreigltiscc2ltcwa6xvdyashfc3kxibt5pqj6vo6tazauhepg3vhnsy)

> The water folds against a wall of pine.
> A million needles swallow up the noon,
> keeping their dark against a glaring sky—
> leaving the stripped stone at the summit
> to burn alone.
>
> *harsh overhead light, short shadows, thin clear mountain air, sharp distance, overcast, heavy grey sky*

![](https://blobs.farfield.systems/blobs/bafkreihyqwif4bqvvc745rckfufwinv3kz2avjusommiced3vtlhsmvumm)

![](https://blobs.farfield.systems/blobs/bafkreif73dkmdi653kp5x7kqt6o2brm4kuososfw4gb4ezmr6mi5krpbbe)

> Noon pins the pine shadows tight to the dirt.
> Down on the baking asphalt, four white letters
> order an absolute halt—
> a desperate rule drawn at the shore,
> as if the heavy blue water was planning to leave.
>
> *harsh overhead light, short shadows, thin clear mountain air, sharp distance, overcast, heavy grey sky*

![](https://blobs.farfield.systems/blobs/bafkreicu6lvobh6f5pbw7dcgf5fsrqy4xxwvq6m2ab67fzmnc6cfloogni)

![](https://blobs.farfield.systems/blobs/bafkreig3oxahwoifgz453lsnc6yohkpqdryuxvhjun2sse7qpexyutpzm4)

> The road paints its white panic on the asphalt
> just short of the pines.
> *STOP*, it orders the midday heat—
> as if the deep mountain water
> gave a damn where our pavement ends.
>
> *harsh overhead light, short shadows, thin clear mountain air, sharp distance, overcast, heavy grey sky*

![](https://blobs.farfield.systems/blobs/bafkreid7esenmjqjofgcodod5oise3vzyar3p2xkya323cftwr4ofjcfzm)

![](https://blobs.farfield.systems/blobs/bafkreihc3rmvvenpg57atlwq366uqcdoqqajcooj5ezffnnxq4gaxhuh3q)

> The broken log holds the sky,  
> while the stump listens to the edge of quiet —  
> light bleeding through the tops of trees  
> and the earth exhales, unbroken.
>
> *clear daylight from the east, thin clear mountain air, sharp distance, overcast, heavy grey sky*

![](https://blobs.farfield.systems/blobs/bafkreighxiv55r3i4n4yxk7isyanpvnc42hi5u7lrzlf3aptflb2q74kym)

---

## Related

- [Ocean Dreams](https://iammatthias.com/art/1738786576559-ocean-dreams.md): Early GAN art from coastal images, creating three collections of dreamy, hallucinatory seascapes that inspired further.
- [I Got a Common Turtle](https://iammatthias.com/posts/1775137360175-i-got-a-common-turtle.md): I got a Common turtle from Claude Code's deterministic buddy system, so I brute-forced the generation algorithm.
- [No Stone Unturned](https://iammatthias.com/art/1710823985569-no-stone-unturned.md): A rock traveled in my camera bag, and was photographed time and time again.
- [Flatframe](https://iammatthias.com/posts/1563778800000-flatframe.md): Aerial photography technique capturing motion in a static frame (like waves or crowds) using stationary drone footage between 10-60 seconds.
- [Datamosh](https://iammatthias.com/art/1791519648658-datamosh.md): An iOS app
- [Buddydex](https://iammatthias.com/experiments/1789660275000-buddydex.md): BuddyDex brute-forces the deterministic hashing pipeline behind Claude Code's short-lived April Fools' buddies, finding account ids that produce a desired species, rarity, stats, or shiny status.
