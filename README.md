# Loop Forge

...

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.


### Production

Create a production build:

```bash
npm run build
```

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

Make sure to deploy the output of `npm run build`, or use `npm run start` to build and run the bundle locally.

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

### Deploy

Code is deployed automatically by a [Vercel project](https://vercel.com/nathan-charrois-projects ) when changes are detected on `master` in this Github repository.

---

Built with ❤️ in Vancouver
