```
   ___   ___
      / /
     / /           ___        _   __
    / /          //   ) )   // ) )  ) )
   / /          //   / /   // / /  / /
__/ /___       ((___( (   // / /  / /


    /|    //| |
   //|   // | |     ___     __  ___  __  ___    / __       ( )      ___        ___
  // |  //  | |   //   ) )   / /      / /      //   ) )   / /     //   ) )   ((   ) )
 //  | //   | |  //   / /   / /      / /      //   / /   / /     //   / /     \ \
//   |//    | | ((___( (   / /      / /      //   / /   / /     ((___( (   //   ) )
```

### hi

The current iteration of my personal website is a multi-tenant experiment.

One code base, one deployment, multiple websites with unique content.

- iammatthias.com
- iammatthias.xyz
- iammatthias.art

The beauty of this system is that I can add new `tenants` at any point. Specific endpoints tied to specific domains for specific content.

It is rough around the edges, but perfectly serviceable for my needs at the moment.

### how it works

We are using NextJS and the App directory. Within our root `page.tsx` we are checking the `host` header and rendering the appropriate tenant dynamically. This adds a slight delay to the initial load, but in practice it is not noticeable due to caching. Downstream data fetching is handled within `<Suspense />`.
