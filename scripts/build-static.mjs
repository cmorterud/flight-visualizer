import { cp } from "node:fs/promises";

// GitHub Pages serves this file for direct visits to client-side routes such
// as /recording, allowing the React application to handle the route.
await cp("dist/index.html", "dist/404.html");
