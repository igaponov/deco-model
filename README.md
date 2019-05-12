# Deco model

Decompression models for scuba diving

# Installation

```
npm install --save deco-model
```

or

```
yarn add deco-model
```

# Usage

```javascript
import { ZHL16, gfName, createZHL16BTissues } from 'deco-model';

const SURFACE_PRESSURE = 1.01325; // bar
const WATER_DENSITY = 1022; // kg/m3, salt water

// create ZHL16B algorithm
const algorithm = new ZHL16(createZHL16BTissues(), SURFACE_PRESSURE, WATER_DENSITY);

// initialize dive
let prevDepth = null; // meters
let nextDepth = 0; // meters
let time = 0; // sec
let n2 = 0.68; // EAN32, N2 = 68%
let he = 0;
let attrs = { [gfName]: 0.3 }; // gradient factor = 30%
const [limit, attrs] = algorithm.ceilingLimit(prevDepth, nextDepth, time, n2, he, attrs);
console.log(limit); // ceiling

// descent
let prevDepth = 0; // meters
let nextDepth = 30; // meters
let time = 90; // sec = 1.5 min
let n2 = 0.68; // EAN32, N2 = 68%
let he = 0;
let attrs = { ...attrs, [gfName]: 0.3 }; // pass previous compartments, gradient factor = 30%
const [limit, attrs] = algorithm.ceilingLimit(prevDepth, nextDepth, time, n2, he, attrs);
console.log(limit); // ceiling

// swim
let prevDepth = 30; // meters
let nextDepth = 30; // meters
let time = 1200; // sec = 20 min
let n2 = 0.68; // EAN32, N2 = 68%
let he = 0;
let attrs = { ...attrs, [gfName]: 0.3 }; // pass previous compartments, gradient factor = 30%
const [limit, attrs] = algorithm.ceilingLimit(prevDepth, nextDepth, time, n2, he, attrs);
console.log(limit); // ceiling

// ascent
let prevDepth = 30; // meters
let nextDepth = 0; // meters
let time = 180; // sec = 3 min
let n2 = 0.68; // EAN32, N2 = 68%
let he = 0;
let attrs = { ...attrs, [gfName]: 0.8 }; // pass previous compartments, gradient factor = 80%
const [limit, attrs] = algorithm.ceilingLimit(prevDepth, nextDepth, time, n2, he, attrs);
console.log(limit); // ceiling

// ...
```

# License

Copyright (c) 2019-present Igor Gaponov

Licensed under the Apache-2.0 license.
