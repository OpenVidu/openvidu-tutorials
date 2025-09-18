# openvidu-custom-lang

This tutorial demonstrates how to add a custom language to the OpenVidu Angular components library.

## Overview

The OpenVidu Angular components library supports internationalization (i18n) out of the box. This tutorial shows you how to:

1. Create a custom language file with translations
2. Configure the OpenVidu components to use your custom language
3. Allow users to switch between different languages

## Prerequisites

- Node.js and npm installed
- Angular CLI installed
- Basic knowledge of Angular and TypeScript

## Project Structure

```
src/
├── app/
│   └── app.component.ts          # Main component with OpenVidu configuration
├── assets/
│   └── lang/
│       └── custom.json           # Custom language translations (Spanish)
└── styles.scss                   # Custom styling
```

## How It Works

### 1. Custom Language File

The custom language translations are stored in `src/assets/lang/custom.json`.

> The default structure of the JSON file can be found in one of the built-in language files provided by OpenVidu Components Angular. Check it [here](https://github.com/OpenVidu/openvidu/tree/master/openvidu-components-angular/projects/openvidu-components-angular/src/lib/lang).

### 2. Component Configuration

In `src/app/app.component.ts`, the OpenVidu videoconference component is configured with:

```typescript
<ov-videoconference
  [token]="token"
  [livekitUrl]="LIVEKIT_URL"
  [lang]="'es'"                    // Default language
  [langOptions]="[                // Available language options
    { name: 'English', lang: 'en' },
    { name: 'custom', lang: 'custom' }
  ]"
  (onTokenRequested)="onTokenRequested($event)"
></ov-videoconference>
```

### 3. Language Options

- `'en'`: Built-in English translations
- `'es'`: Built-in Spanish translations
- `'custom'`: Your custom translations from the JSON file

## Running the Tutorial

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:5080`

4. **Join a room** and test the language switching functionality

## Customizing the Language

### Adding New Translations

1. Open `src/assets/lang/custom.json`
2. Add new translation keys following the existing structure
3. The keys should match the ones used by OpenVidu components

### Creating Multiple Custom Languages

1. Create additional JSON files in `src/assets/lang/` (e.g., `french.json`, `german.json`)
2. Update the `langOptions` in `app.component.ts` to include your new languages
3. Make sure the JSON files are included in the Angular build (check `angular.json`)

### Changing the Default Language

Modify the `[lang]` property in `app.component.ts`:

```typescript
[lang]="'custom'"  // Use custom language as default
```

## Key Features Demonstrated

- **Custom Language Support**: How to provide your own translations
- **Language Switching**: Allow users to change languages at runtime
- **Asset Management**: How to include language files in Angular builds
- **Component Configuration**: Proper setup of OpenVidu components with i18n

## Next Steps

- Explore the OpenVidu documentation for more i18n features
- Add more languages to your application
- Implement language persistence (save user preference)
- Create dynamic language loading for better performance

## Learn More

- [OpenVidu Angular Components Documentation](https://docs.openvidu.io/en/stable/components/)
- [Angular Internationalization](https://angular.io/guide/i18n)
- [OpenVidu Tutorials](https://docs.openvidu.io/en/stable/tutorials/)