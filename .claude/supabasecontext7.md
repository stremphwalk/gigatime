========================
CODE SNIPPETS
========================
TITLE: Render Supabase Getting Started Resources with React/JSX
DESCRIPTION: This JSX code snippet demonstrates how to dynamically render a grid of 'Getting Started' resources using React components. It maps over an array of resource objects, creating a clickable Link for each, which wraps a GlassPanel component to display the resource's title and description. This pattern is common for navigation or content display.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started.mdx#_snippet_0

LANGUAGE: jsx
CODE:
```
{[
  {
    title: 'Features',
    hasLightIcon: true,
    href: '/guides/getting-started/features',
    description: 'A non-exhaustive list of features that Supabase provides for every project.'
  },
  {
    title: 'Architecture',
    hasLightIcon: true,
    href: '/guides/getting-started/architecture',
    description: "An overview of Supabase's architecture and product principles.",
  },
  {
    title: 'Local Development',
    hasLightIcon: true,
    href: '/guides/cli/getting-started',
    description: 'Use the Supabase CLI to develop locally and collaborate between teams.',
  }
].map((resource) => {
  return (
    <Link
      href={`${resource.href}`}
      key={resource.title}
      className={'col-span-12 md:col-span-4'}
      passHref
    >
      <GlassPanel {...resource} background={false} showIconBg={true}>
        {resource.description}
      </GlassPanel>
    </Link>
  )
})}
```

----------------------------------------

TITLE: Start Next.js Development Server
DESCRIPTION: This snippet demonstrates how to launch the Next.js development server using common Node.js package managers such as npm, yarn, pnpm, or bun. Executing any of these commands will start the application, typically making it accessible via a web browser at http://localhost:3000.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/clerk/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

----------------------------------------

TITLE: Supabase Studio: Local Development Quickstart
DESCRIPTION: Commands to set up and run Supabase Studio locally for development, including dependency installation, secret pulling (for internal use), starting the development server, and running tests. This process requires Node.js v20 and assumes you are in the `/studio` directory.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/studio/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
# You'll need to be on Node v20
# in /studio

npm i # install dependencies
npm run dev:secrets:pull # Supabase internal use: if you are working on the platform version of the Studio
npm run dev # start dev server
npm run test # run tests
npm run -- --watch # run tests in watch mode
```

----------------------------------------

TITLE: Commit Initial Setup and Start Local Supabase (Bash)
DESCRIPTION: Stages and commits the initial Supabase setup files to Git, then starts the local Supabase development environment. This prepares your local database for schema changes.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/deployment/managing-environments.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
git add .
git commit -m "init supabase"
supabase start
```

----------------------------------------

TITLE: Supabase Studio: Install and Run After Environment Configuration
DESCRIPTION: Commands to install Node.js dependencies and start the Supabase Studio development server. These steps are executed after configuring the essential environment variables in a self-hosted setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/studio/README.md#_snippet_3

LANGUAGE: bash
CODE:
```
npm install
npm run dev
```

----------------------------------------

TITLE: Payload CMS Local Development Setup
DESCRIPTION: Follow these steps to set up and run the Payload CMS application on your local machine. This includes starting the local Supabase instance, configuring environment variables, installing project dependencies, and launching the development server.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/cms/README.md#_snippet_0

LANGUAGE: Shell
CODE:
```
cd apps/cms && supabase start
```

LANGUAGE: Shell
CODE:
```
cp .env.example .env
```

LANGUAGE: Shell
CODE:
```
pnpm install && pnpm generate:importmap
```

LANGUAGE: Shell
CODE:
```
pnpm dev
```

LANGUAGE: Shell
CODE:
```
pnpm dev:cms
```

----------------------------------------

TITLE: Start Local Supabase Services and Serve Edge Function
DESCRIPTION: Instructions to start the local Supabase development server and serve a specific Edge Function. This allows for local testing and includes hot-reloading capabilities for development.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
supabase start  # Start all Supabase services
supabase functions serve hello-world
```

----------------------------------------

TITLE: Initialize SvelteKit App and Install Supabase Client
DESCRIPTION: This snippet guides you through setting up a new SvelteKit project, navigating into the project directory, installing initial dependencies, and then adding the Supabase JavaScript client library to your application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-sveltekit.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx sv create supabase-sveltekit
cd supabase-sveltekit
npm install
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Start Laravel development server
DESCRIPTION: Launch the Laravel development server using `php artisan serve`. This command makes your application accessible in a web browser, typically at `http://127.0.0.1:8000`, allowing you to test and interact with your application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-22-laravel-postgres.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
php artisan serve
```

----------------------------------------

TITLE: Run Development Server with npm start
DESCRIPTION: This command starts the application in development mode. It automatically opens the app in your browser at http://localhost:3000 and reloads the page whenever you make changes to the code. Any lint errors will also be displayed in the console.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/app/README.md#_snippet_0

LANGUAGE: npm
CODE:
```
npm start
```

----------------------------------------

TITLE: Run Next.js Development Server
DESCRIPTION: This snippet provides commands to start the local development server for a Next.js application using various package managers like npm, yarn, pnpm, or bun. The server typically runs on `http://localhost:3000`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/ui-library/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

----------------------------------------

TITLE: Install Laravel Breeze for authentication
DESCRIPTION: Add Laravel Breeze as a development dependency to your project. After installation, run the `breeze:install` Artisan command to set up Laravel's built-in authentication features, including login, registration, password reset, and email verification.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-22-laravel-postgres.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
composer require laravel/breeze --dev
php artisan breeze:install
```

----------------------------------------

TITLE: Install Progress Component
DESCRIPTION: Provides commands for installing the Progress component, either via the Shadcn UI CLI for quick setup or by manually installing its core Radix UI dependency using npm.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/progress.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add progress
```

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-progress
```

----------------------------------------

TITLE: Install vecs Python Client
DESCRIPTION: Instructions to install the `vecs` Python client using pip. This client facilitates interaction with PostgreSQL databases equipped with the `pgvector` extension. Requires Python 3.7+.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/ai/vector_hello_world.ipynb#_snippet_0

LANGUAGE: Python
CODE:
```
pip install vecs
```

----------------------------------------

TITLE: Create New Supabase Database Migration File Locally
DESCRIPTION: Generates a new, empty migration file within your local Supabase project. This command is used to prepare for database schema changes that will be tracked and applied through migrations. The example creates a file named 'user_management_starter'.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/project_setup.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
supabase migration new user_management_starter
```

----------------------------------------

TITLE: Create and populate example `instruments` table for `EXPLAIN`
DESCRIPTION: This SQL code defines an `instruments` table with `id` and `name` columns, then populates it with sample data. This setup is used to provide a concrete example for demonstrating the output of the `explain()` method in subsequent sections.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/debugging-performance.mdx#_snippet_2

LANGUAGE: sql
CODE:
```
create table instruments (
  id int8 primary key,
  name text
);

insert into books
  (id, name)
values
  (1, 'violin'),
  (2, 'viola'),
  (3, 'cello');
```

----------------------------------------

TITLE: Install Select component using Shadcn UI CLI
DESCRIPTION: Installs the Shadcn UI Select component by running a command-line interface tool, which automates the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/select.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add select
```

----------------------------------------

TITLE: Initialize Ionic Angular App and Install Supabase Client
DESCRIPTION: These Bash commands guide the setup of a new Ionic Angular project for a Supabase application. It includes initializing a blank Angular project, installing the `@supabase/supabase-js` client library, and generating essential pages (login, register, groups, messages) and services (auth, data) for the app's structure.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-11-08-authentication-in-ionic-angular.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
ionic start supaAuth blank --type=angular
npm install @supabase/supabase-js

# Add some pages
ionic g page pages/login
ionic g page pages/register
ionic g page pages/groups
ionic g page pages/messages

# Generate services
ionic g service services/auth
ionic g service services/data
```

----------------------------------------

TITLE: Create a new Flutter project
DESCRIPTION: Initializes a new Flutter application with the specified name, setting up the basic project structure and necessary files.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-07-18-flutter-authentication.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
flutter create myauthapp
```

----------------------------------------

TITLE: Create a new Laravel PHP project
DESCRIPTION: Use Composer, PHP's dependency manager, to scaffold a new Laravel application. This command initializes the basic project structure in a new directory named 'example-app'.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-22-laravel-postgres.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
composer create-project laravel/laravel example-app
```

----------------------------------------

TITLE: Install project dependencies
DESCRIPTION: This command installs all necessary Node.js dependencies for the Hono Supabase project, as defined in the `package.json` file. It is a standard first step after cloning the repository to ensure all required packages are available.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/auth/hono/README.md#_snippet_2

LANGUAGE: Bash
CODE:
```
npm install
```

----------------------------------------

TITLE: Install Resizable component via shadcn-ui CLI
DESCRIPTION: Installs the Resizable component and its dependencies using the shadcn-ui CLI tool, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/resizable.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add resizable
```

----------------------------------------

TITLE: Install Supabase JavaScript client
DESCRIPTION: This command installs the `@supabase/supabase-js` package using npm. This client library is essential for interacting with Supabase services, including database changes, from a JavaScript application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/realtime/postgres-changes.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Start Ruby on Rails development server
DESCRIPTION: Initiate the Rails development server, making the application accessible via a web browser. This command starts the server on the default port, typically `http://127.0.0.1:3000`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
bin/rails server
```

----------------------------------------

TITLE: Install Dropdown Menu component using CLI
DESCRIPTION: Installs the Shadcn UI Dropdown Menu component using the `npx shadcn-ui` command-line interface, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/dropdown-menu.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add dropdown-menu
```

----------------------------------------

TITLE: Initialize Ionic Angular App and Install Supabase JS Dependencies (Bash)
DESCRIPTION: These bash commands guide the setup of a new Ionic Angular project. It includes installing the Ionic CLI globally, creating a blank Angular project, navigating into the project directory, and finally installing the `@supabase/supabase-js` library as a project dependency.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-ionic-angular.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npm install -g @ionic/cli
ionic start supabase-ionic-angular blank --type angular
cd supabase-ionic-angular
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Install Command Component using shadcn-ui CLI
DESCRIPTION: Installs the `command` component using the shadcn-ui CLI, which automates setup and configuration for your project.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/command.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add command
```

----------------------------------------

TITLE: Install Supabase.js and Dependencies for React Native
DESCRIPTION: This command installs the necessary Supabase JavaScript client (`@supabase/supabase-js`) along with `@react-native-async-storage/async-storage` for persistent session storage and `react-native-url-polyfill` for URL polyfilling in a React Native Expo project. These packages are essential for integrating Supabase authentication reliably.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-11-16-react-native-authentication.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

----------------------------------------

TITLE: Initialize and start Supabase locally
DESCRIPTION: These commands are used to set up and run a local Supabase instance. First, initialize Supabase within your project directory, which creates necessary configuration files. Then, start the local Supabase stack, making the database and other services available for development.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/mixpeek-video-search.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
supabase init
```

LANGUAGE: shell
CODE:
```
supabase start
```

----------------------------------------

TITLE: Run Next.js Development Server with various package managers
DESCRIPTION: This snippet provides commands to start the Next.js development server using different Node.js package managers. The server typically runs on `http://localhost:3000` and supports hot-reloading for `app/page.tsx` and other files. It's essential for local development and testing.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run dev
```

LANGUAGE: bash
CODE:
```
yarn dev
```

LANGUAGE: bash
CODE:
```
pnpm dev
```

LANGUAGE: bash
CODE:
```
bun dev
```

----------------------------------------

TITLE: Install RNEUI Themed for React Native UI Components
DESCRIPTION: This command installs the `@rneui/themed` library, which provides a comprehensive set of cross-platform UI components for React Native applications. These components, such as buttons and input fields, simplify the development of user interfaces.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-11-16-react-native-authentication.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
npm install @rneui/themed
```

----------------------------------------

TITLE: Configure Jackson Serialization for Supabase-kt
DESCRIPTION: This snippet demonstrates how to include the `serializer-jackson` dependency in your project's `build.gradle.kts` file to enable Jackson serialization with `supabase-kt`. (Note: Client configuration example is not provided in the source text).

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/v1/installing.mdx#_snippet_5

LANGUAGE: kotlin
CODE:
```
implementation("io.github.jan-tennert.supabase:serializer-jackson:VERSION")
```

----------------------------------------

TITLE: Install Sheet component using shadcn-ui CLI
DESCRIPTION: Installs the Sheet UI component using the shadcn-ui command-line interface, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/sheet.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add sheet
```

----------------------------------------

TITLE: Run the refine Development Server (Bash)
DESCRIPTION: After initializing the application and installing all dependencies, these commands are used to start the development server. First, navigate into the project directory (`app-name`), then execute `npm run dev` to launch the application, typically accessible at `http://localhost:5173`.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-refine.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
cd app-name
npm run dev
```

----------------------------------------

TITLE: Initialize SolidJS App and Install Supabase.js
DESCRIPTION: This snippet demonstrates how to initialize a new SolidJS application using `degit` and then install the `supabase-js` client library as a dependency. These are the foundational steps to set up your project environment.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-solidjs.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx degit solidjs/templates/ts supabase-solid
cd supabase-solid
```

LANGUAGE: bash
CODE:
```
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Install Table Component using CLI
DESCRIPTION: Installs the Shadcn UI table component using the command-line interface. This command adds the necessary files and dependencies to your project, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/table.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add table
```

----------------------------------------

TITLE: Configure Jackson Serialization for Supabase-kt
DESCRIPTION: This snippet demonstrates how to include the `serializer-jackson` dependency in your project's `build.gradle.kts` file to enable Jackson serialization with `supabase-kt`. (Note: Client configuration example is not provided in the source text).

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/v2/installing.mdx#_snippet_5

LANGUAGE: kotlin
CODE:
```
implementation("io.github.jan-tennert.supabase:serializer-jackson:VERSION")
```

----------------------------------------

TITLE: Add Supabase and Google Sign-In dependencies to Flutter
DESCRIPTION: Installs the `supabase_flutter` package for interacting with a Supabase instance and the `google_sign_in` package for implementing Google social sign-in functionality in a Flutter application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-07-18-flutter-authentication.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
flutter pub add supabase_flutter google_sign_in
```

----------------------------------------

TITLE: Start the app
DESCRIPTION: This final step instructs on how to start the Laravel development server. Once running, you can access the application in your browser, including the registration and login pages, to test the setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/quickstarts/laravel.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
php artisan serve
```

----------------------------------------

TITLE: Install Supabase and Encryption Dependencies for Expo
DESCRIPTION: This snippet provides the necessary `npm` and `npx` commands to install all required dependencies for integrating Supabase with an Expo project, including UI components, asynchronous storage, URL polyfill, and the encryption libraries `aes-js`, `react-native-get-random-values`, and `expo-secure-store` for secure session management.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-11-16-react-native-authentication.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
npm install @supabase/supabase-js
npm install @rneui/themed @react-native-async-storage/async-storage react-native-url-polyfill
npm install aes-js react-native-get-random-values
npx expo install expo-secure-store
```

----------------------------------------

TITLE: Build Production App with npm run build
DESCRIPTION: This command builds the application for production, outputting the optimized files into the 'build' folder. It correctly bundles React in production mode, minifies the code, and includes hashes in filenames for caching, preparing your app for deployment.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/app/README.md#_snippet_2

LANGUAGE: npm
CODE:
```
npm run build
```

----------------------------------------

TITLE: Initialize and run a new Flutter application
DESCRIPTION: This snippet outlines the initial steps to create a new Flutter project using the `flutter create` command and then navigate into its directory to run the default application. It's the foundational setup for any Flutter development.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-06-30-flutter-tutorial-building-a-chat-app.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
flutter create my_chat_app
cd my_chat_app
flutter run
```

----------------------------------------

TITLE: Set up a new Python project with Poetry
DESCRIPTION: These commands guide you through installing Poetry, a Python packaging and dependency management tool, and then initializing a new Python project named 'video-search'. This sets up the basic project structure for your application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/mixpeek-video-search.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pip install poetry
```

LANGUAGE: shell
CODE:
```
poetry new video-search
```

----------------------------------------

TITLE: Setup Supabase Local Environment Variables
DESCRIPTION: This snippet demonstrates how to prepare your local development environment by copying the example environment file to a local configuration file. This file will contain sensitive variables required for the Supabase function to operate correctly.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/openai/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
cp supabase/.env.local.example supabase/.env.local
```

----------------------------------------

TITLE: Install Input OTP dependency manually
DESCRIPTION: This command installs the `input-otp` package using npm, which is required for manual project setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/input-otp.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install input-otp
```

----------------------------------------

TITLE: Install and Start Roboflow Inference Server
DESCRIPTION: This command installs the necessary Python packages for Roboflow Inference and starts the local inference server. The server will be available at `http://localhost:9001` for subsequent inference requests.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/integrations/roboflow.mdx#_snippet_0

LANGUAGE: shell
CODE:
```
pip install inference inference-cli inference-sdk && inference server start
```

----------------------------------------

TITLE: Supabase Edge Function Starter Code (Deno/TypeScript)
DESCRIPTION: Provides the default TypeScript starter code for a Supabase Edge Function. This example demonstrates a simple function that accepts a JSON payload with a `name` field and returns a greeting message.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_1

LANGUAGE: typescript
CODE:
```
Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})
```

----------------------------------------

TITLE: Install PostgreSQL on Windows
DESCRIPTION: Provides step-by-step instructions to install PostgreSQL on a Windows system. This includes downloading the installer, manually adding the PostgreSQL binary path to the system's environment variables, and verifying the installation by checking the `psql` version in the terminal.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/_partials/postgres_installation.mdx#_snippet_0

LANGUAGE: filepath
CODE:
```
C:\Program Files\PostgreSQL\17\bin
```

LANGUAGE: sh
CODE:
```
psql --version
```

----------------------------------------

TITLE: Start Supabase Development Server
DESCRIPTION: This command initiates the local development server for your Supabase project. Once started, the application will be accessible in your web browser at `http://localhost:5173`, allowing you to view and interact with your application.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/quickstarts/sveltekit.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Run Supabase Bootstrap Command for Project Initialization
DESCRIPTION: Illustrates different methods to execute the `supabase bootstrap` command, enabling users to quickly set up a new Supabase project from starter templates. This includes direct CLI usage, `npx` for Node.js environments, and `bunx` for Bun environments.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-04-15-supabase-bootstrap.mdx#_snippet_0

LANGUAGE: Bash
CODE:
```
npx supabase bootstrap
```

LANGUAGE: Bash
CODE:
```
supabase bootstrap
```

LANGUAGE: Bash
CODE:
```
npx supabase@latest bootstrap
```

LANGUAGE: Bash
CODE:
```
bunx supabase@latest bootstrap
```

----------------------------------------

TITLE: Upload a File to Supabase Storage
DESCRIPTION: This section illustrates the process of uploading files to a Supabase storage bucket. It shows how to select a file and use the Supabase client libraries to upload it to a specified bucket and path. Examples are provided for JavaScript and Dart.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/storage/quickstart.mdx#_snippet_1

LANGUAGE: JavaScript
CODE:
```
const avatarFile = event.target.files[0]
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', avatarFile)
```

LANGUAGE: Dart
CODE:
```
void main() async {
  final supabase = SupabaseClient('supabaseUrl', 'supabaseKey');

  // Create file `example.txt` and upload it in `public` bucket
  final file = File('example.txt');
  file.writeAsStringSync('File content');
  final storageResponse = await supabase
      .storage
      .from('public')
      .upload('example.txt', file);
}
```

----------------------------------------

TITLE: Run the ChatGPT Retrieval Plugin locally
DESCRIPTION: Execute this command to start the ChatGPT Retrieval Plugin in development mode. Ensure all dependencies are installed and environment variables are correctly configured before running the plugin.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/building-chatgpt-plugins.mdx#_snippet_4

LANGUAGE: Bash
CODE:
```
poetry run dev
```

----------------------------------------

TITLE: Start Supabase Local Development Environment
DESCRIPTION: This command initializes and starts the Supabase local development environment. It applies all migrations found in the `supabase/migrations` directory to the local database, preparing it for use.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/nextjs-vector-search.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
supabase start
```

----------------------------------------

TITLE: Run Next.js Development Server with various package managers
DESCRIPTION: This snippet provides commands to start the Next.js development server using different Node.js package managers. The server typically runs on `http://localhost:3000` and supports hot-reloading for `app/page.tsx` and other files. It's essential for local development and testing.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/caching/with-react-query-nextjs-14/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npm run dev
```

LANGUAGE: bash
CODE:
```
yarn dev
```

LANGUAGE: bash
CODE:
```
pnpm dev
```

LANGUAGE: bash
CODE:
```
bun dev
```

----------------------------------------

TITLE: Install and Run Supabase with Docker
DESCRIPTION: Provides shell commands to clone the Supabase repository, set up a project directory, copy Docker compose files, configure environment variables, pull Docker images, and start Supabase services in detached mode. This includes both general and advanced Git cloning methods for initial setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/self-hosting/docker.mdx#_snippet_0

LANGUAGE: sh
CODE:
```
# Get the code
git clone --depth 1 https://github.com/supabase/supabase

# Make your new supabase project directory
mkdir supabase-project

# Tree should look like this
# .
# ├── supabase
# └── supabase-project

# Copy the compose files over to your project
cp -rf supabase/docker/* supabase-project

# Copy the fake env vars
cp supabase/docker/.env.example supabase-project/.env

# Switch to your project directory
cd supabase-project

# Pull the latest images
docker compose pull

# Start the services (in detached mode)
docker compose up -d
```

LANGUAGE: sh
CODE:
```
# Get the code using git sparse checkout
git clone --filter=blob:none --no-checkout https://github.com/supabase/supabase
cd supabase
git sparse-checkout set --cone docker && git checkout master
cd ..

# Make your new supabase project directory
mkdir supabase-project

# Tree should look like this
# .
# ├── supabase
# └── supabase-project

# Copy the compose files over to your project
cp -rf supabase/docker/* supabase-project

# Copy the fake env vars
cp supabase/docker/.env.example supabase-project/.env

# Switch to your project directory
cd supabase-project

# Pull the latest images
docker compose pull

# Start the services (in detached mode)
docker compose up -d
```

----------------------------------------

TITLE: Install Shadcn UI Card Component via CLI
DESCRIPTION: This command installs the Shadcn UI Card component using the `npx shadcn-ui` command-line interface. It adds the necessary files and configurations to your project, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/card.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add card
```

----------------------------------------

TITLE: Configure Jackson Serialization for Supabase-kt
DESCRIPTION: This snippet demonstrates how to include the `serializer-jackson` dependency in your project's `build.gradle.kts` file to enable Jackson serialization with `supabase-kt`. (Note: Client configuration example is not provided in the source text).

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/installing.mdx#_snippet_5

LANGUAGE: kotlin
CODE:
```
implementation("io.github.jan-tennert.supabase:serializer-jackson:VERSION")
```

----------------------------------------

TITLE: Initialize React App with Vite and Install Supabase JS
DESCRIPTION: This snippet demonstrates how to set up a new React project using Vite and then install the Supabase JavaScript client library. It provides the initial commands to get a React development environment ready for Supabase integration.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-react.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npm create vite@latest supabase-react -- --template react
cd supabase-react
```

LANGUAGE: bash
CODE:
```
npm install @supabase/supabase-js
```

----------------------------------------

TITLE: Create a new Ruby on Rails project with Postgres
DESCRIPTION: Scaffold a new Ruby on Rails application, configuring it to use PostgreSQL as the database. This command initializes the project structure and sets up the necessary database adapter.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
rails new blog -d=postgresql
```

----------------------------------------

TITLE: Add Supabase Kotlin Modules to Project Build Files
DESCRIPTION: This section provides instructions and code examples for adding Supabase Kotlin modules, such as Postgrest, Auth, and Realtime, to your project's build configuration. Examples are provided for Gradle (Kotlin DSL and Groovy DSL) and Maven, demonstrating how to use the Supabase Bill of Materials (BOM) for consistent dependency management.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/installing.mdx#_snippet_0

LANGUAGE: Kotlin
CODE:
```
implementation(platform("io.github.jan-tennert.supabase:bom:VERSION"))
implementation("io.github.jan-tennert.supabase:postgrest-kt")
implementation("io.github.jan-tennert.supabase:auth-kt")
implementation("io.github.jan-tennert.supabase:realtime-kt")
```

LANGUAGE: Groovy
CODE:
```
implementation platform("io.github.jan-tennert.supabase:bom:VERSION")
implementation 'io.github.jan-tennert.supabase:postgrest-kt'
implementation 'io.github.jan-tennert.supabase:auth-kt'
implementation 'io.github.jan-tennert.supabase:realtime-kt'
```

LANGUAGE: XML
CODE:
```
<dependency>
    <groupId>io.github.jan-tennert.supabase</groupId>
    <artifactId>bom</artifactId>
    <version>VERSION</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
<dependency>
    <groupId>io.github.jan-tennert.supabase</groupId>
    <artifactId>postgrest-kt</artifactId>
</dependency>
<dependency>
    <groupId>io.github.jan-tennert.supabase</groupId>
    <artifactId>auth-kt</artifactId>
</dependency>
<dependency>
    <groupId>io.github.jan-tennert.supabase</groupId>
    <artifactId>realtime-kt</artifactId>
</dependency>
```

----------------------------------------

TITLE: Install Drawer component using shadcn-ui CLI
DESCRIPTION: Installs the Drawer component and its dependencies into a project using the shadcn-ui command-line interface. This method simplifies setup by automating the addition of necessary files and configurations.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/drawer.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add drawer
```

----------------------------------------

TITLE: Deploy Application using Fly.io CLI
DESCRIPTION: Deploys the application to Fly.io. This command handles uploading the application, building a machine image, deploying the images, and monitoring for a successful startup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_8

LANGUAGE: bash
CODE:
```
fly deploy
```

----------------------------------------

TITLE: Install Dropdown Menu dependencies manually with npm
DESCRIPTION: Installs the `@radix-ui/react-dropdown-menu` dependency required for the manual setup of the Dropdown Menu component. This is an alternative to the CLI installation.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/dropdown-menu.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-dropdown-menu
```

----------------------------------------

TITLE: Start Supabase Services with Docker Compose (Postgres Backend)
DESCRIPTION: This command sequence demonstrates how to clone the Supabase repository, navigate to the `docker` directory, and then start the Supabase services using `docker compose`. This setup utilizes the Postgres backend for analytics, which is recommended for familiarization and experimentation.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/self-hosting-analytics/introduction.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
# clone the supabase/supabase repo, and run the following
cd docker
docker compose -f docker-compose.yml up
```

----------------------------------------

TITLE: Initialize a RedwoodJS application
DESCRIPTION: This command creates a new RedwoodJS project named `supabase-redwoodjs` and navigates into its directory. It sets up the basic project structure and installs necessary dependencies.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-redwoodjs.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
yarn create redwood-app supabase-redwoodjs
cd supabase-redwoodjs
```

----------------------------------------

TITLE: Install Context Menu component using shadcn-ui CLI
DESCRIPTION: This command installs the Context Menu component into your project using the shadcn-ui command-line interface, simplifying the setup process by automatically adding necessary files and configurations.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/context-menu.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add context-menu
```

----------------------------------------

TITLE: Configure Ktor Client Engines for Kotlin Multiplatform Projects
DESCRIPTION: This example demonstrates how to set up Ktor HTTP client engine dependencies within a Kotlin Multiplatform project. It illustrates platform-specific engine declarations for JVM (CIO), Android, JavaScript (JS), and iOS (Darwin) in a `build.gradle.kts` file.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/docs/ref/kotlin/v1/installing.mdx#_snippet_2

LANGUAGE: Kotlin
CODE:
```
val commonMain by getting {
    dependencies {
        //supabase modules
    }
}
val jvmMain by getting {
    dependencies {
        implementation("io.ktor:ktor-client-cio:KTOR_VERSION")
    }
}
val androidMain by getting {
    dependsOn(jvmMain)
}
val jsMain by getting {
    dependencies {
        implementation("io.ktor:ktor-client-js:KTOR_VERSION")
    }
}
val iosMain by getting {
    dependencies {
        implementation("io.ktor:ktor-client-darwin:KTOR_VERSION")
    }
}
```

----------------------------------------

TITLE: Install Collapsible component using shadcn-ui CLI
DESCRIPTION: Installs the Collapsible component and its dependencies using the shadcn-ui CLI tool, simplifying the setup process for your project.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/collapsible.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add collapsible
```

----------------------------------------

TITLE: Start Supabase services and React development server
DESCRIPTION: Executes two commands concurrently: `supabase start` to launch the local Supabase backend services and `npm start` to run the React application's development server. This setup allows for full local development, with both your frontend and backend services running and communicating.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2021-03-31-supabase-cli.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
supabase start  # Start Supabase
npm start       # Start the React app
```

----------------------------------------

TITLE: Start RedwoodJS development server
DESCRIPTION: This command launches the RedwoodJS development server, allowing you to preview your application locally. It compiles your code and provides a live-reloading environment for development.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-redwoodjs.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
yarn rw dev
```

----------------------------------------

TITLE: Initialize a New Flutter Project
DESCRIPTION: This command initializes a new Flutter application named `supabase_quickstart`. It sets up the basic project structure and necessary files for a Flutter development environment.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-flutter.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
flutter create supabase_quickstart
```

----------------------------------------

TITLE: Launch Test Runner with npm test
DESCRIPTION: This command launches the test runner in an interactive watch mode. It allows you to run your application's tests and provides feedback as you develop, helping to ensure code quality and functionality.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/app/README.md#_snippet_1

LANGUAGE: npm
CODE:
```
npm test
```

----------------------------------------

TITLE: Install Sheet component dependencies manually
DESCRIPTION: Installs the required `@radix-ui/react-dialog` dependency, which is essential for the manual setup of the Sheet component.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/sheet.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-dialog
```

----------------------------------------

TITLE: Install Calendar component via shadcn-ui CLI
DESCRIPTION: Installs the Calendar component using the shadcn-ui command-line interface. This command automatically adds the component's files to your project, simplifying the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/calendar.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add calendar
```

----------------------------------------

TITLE: Set Up Expo Project for Push Notifications
DESCRIPTION: These commands guide you through installing necessary Expo dependencies, initializing and linking your Expo project with EAS CLI, and starting the development server for a physical device to test push notifications.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/expo-push-notifications/README.md#_snippet_1

LANGUAGE: Shell
CODE:
```
npm i
npm install --global eas-cli && eas init --id your-expo-project-id
npx expo start --dev-client
```

----------------------------------------

TITLE: Start the Refine development server
DESCRIPTION: Execute the `npm run dev` command to start the development server for your refine application. This will typically make the application accessible in your browser at `http://localhost:5173`, displaying the refine Welcome page.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/quickstarts/refine.mdx#_snippet_2

LANGUAGE: bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Install Checkbox component dependencies manually
DESCRIPTION: This command installs the core `@radix-ui/react-checkbox` dependency required for manual setup of the Checkbox component.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/checkbox.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-checkbox
```

----------------------------------------

TITLE: Run Hono development server
DESCRIPTION: This command starts the development server for the Hono application using Vite. It enables features like hot-reloading and provides a local environment for testing and development purposes.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/auth/hono/README.md#_snippet_4

LANGUAGE: Bash
CODE:
```
npm run dev
```

----------------------------------------

TITLE: Download Next.js 13 Supabase Caching Example
DESCRIPTION: Use `curl` to download and extract the specific Next.js 13 caching example project from the Supabase GitHub repository, preparing it for local setup.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/caching/with-nextjs-13/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
curl https://codeload.github.com/supabase/supabase/tar.gz/master | tar -xz --strip=3 supabase-master/examples/caching/with-nextjs-13
```

----------------------------------------

TITLE: Invoke Supabase Edge Function from Application
DESCRIPTION: Demonstrates how to call a deployed Supabase Edge Function from within a client application. Examples include using the Supabase JavaScript client library and the standard Fetch API. Both methods send a POST request with a JSON body and handle the response.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/functions/quickstart.mdx#_snippet_10

LANGUAGE: javascript
CODE:
```
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://[YOUR_PROJECT_ID].supabase.co', 'YOUR_ANON_KEY')

const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'JavaScript' },
})

console.log(data) // { message: "Hello JavaScript!" }
```

LANGUAGE: javascript
CODE:
```
const response = await fetch('https://[YOUR_PROJECT_ID].supabase.co/functions/v1/hello-world', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Fetch' }),
})

const data = await response.json()
console.log(data)
```

----------------------------------------

TITLE: Install Poetry and Project Dependencies
DESCRIPTION: These commands guide you through setting up the Python environment for the image search project. First, install the Poetry package manager, then activate its virtual environment, and finally install all required project dependencies.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/ai/image_search/README.md#_snippet_0

LANGUAGE: shell
CODE:
```
pip install poetry
poetry shell
poetry install
```

----------------------------------------

TITLE: Connect to PostgreSQL with vecs
DESCRIPTION: Demonstrates how to establish a connection to a PostgreSQL database using the `vecs` client. This requires a valid PostgreSQL connection string, with specific formatting considerations for SQLAlchemy and Supabase's connection pooler.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/ai/vector_hello_world.ipynb#_snippet_1

LANGUAGE: Python
CODE:
```
import vecs

DB_CONNECTION = "postgresql://<user>:<password>@<host>:<port>/<db_name>"

# create vector store client
vx = vecs.create_client(DB_CONNECTION)
```

----------------------------------------

TITLE: Install Shadcn UI Skeleton component via CLI
DESCRIPTION: Installs the Shadcn UI Skeleton component into your project using the `npx shadcn-ui` command. This command automates the setup, adding necessary files and dependencies for the component.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/skeleton.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add skeleton
```

----------------------------------------

TITLE: Select employee names based on start date and status in Postgres SQL
DESCRIPTION: Provides an example of a larger SQL query selecting first and last names from the `employees` table, filtering by a date range for `start_date` and a specific `status`. This demonstrates multi-line query formatting for improved readability of complex conditions.

SOURCE: https://github.com/supabase/supabase/blob/master/examples/prompts/code-format-sql.md#_snippet_2

LANGUAGE: SQL
CODE:
```
select
  first_name,
  last_name
from
  employees
where
  start_date between '2021-01-01' and '2021-12-31'
and
  status = 'employed';
```

----------------------------------------

TITLE: Manually install Popover core dependency
DESCRIPTION: Install the @radix-ui/react-popover package, which is the foundational dependency for the Popover component, when opting for manual setup.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/popover.mdx#_snippet_1

LANGUAGE: bash
CODE:
```
npm install @radix-ui/react-popover
```

----------------------------------------

TITLE: Start Rails console for database interaction
DESCRIPTION: Launch the Rails console, an interactive Ruby environment, to directly interact with the application's models and database. This allows for testing and manipulating data outside of the web interface.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-01-29-ruby-on-rails-postgres.mdx#_snippet_3

LANGUAGE: bash
CODE:
```
bin/rails console
```

----------------------------------------

TITLE: Angular Project Initialization and Component Generation
DESCRIPTION: This Bash script demonstrates the initial setup for an Angular project using the Angular CLI. It creates a new project named `trelloBoard` with routing and SCSS styling, then navigates into the project directory. Subsequently, it generates several Angular components for login, workspace, and board views, along with services for authentication and data management, preparing the project structure for development.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-08-24-building-a-realtime-trello-board-with-supabase-and-angular.mdx#_snippet_4

LANGUAGE: bash
CODE:
```
ng new trelloBoard --routing --style=scss
cd ./trelloBoard

# Generate components and services
ng generate component components/login
ng generate component components/inside/workspace
ng generate component components/inside/board

ng generate service services/auth
ng generate service services/data
```

----------------------------------------

TITLE: Install Toggle component using shadcn/ui CLI
DESCRIPTION: This command utilizes the shadcn/ui command-line interface to automatically add the Toggle component and its necessary dependencies to your project, streamlining the setup process.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/toggle.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add toggle
```

----------------------------------------

TITLE: Install Aspect Ratio component using shadcn-ui CLI
DESCRIPTION: This command utilizes the `npx shadcn-ui` command-line interface to automatically add the Aspect Ratio component to your project. It streamlines the installation process by handling dependencies and file setup, making it the recommended approach for quick integration.

SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/components/aspect-ratio.mdx#_snippet_0

LANGUAGE: bash
CODE:
```
npx shadcn-ui@latest add aspect-ratio
```