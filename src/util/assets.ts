export class Assets {
  public static CMSGitIgnore: string = `
# compiled output
/dist
/lib
/node_modules
/public/bundle.*

# Environment
app.env
.env

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
  `;
  public static readonly BCMSConfig = {
    frontend: {
      build: false,
      useCustom: true,
      custom: {
        props: [
          'templateStore',
          {
            name: 'pageTwoTitle',
            value: 'This is MY page 2 title!',
          },
        ],
      },
    },
    server: {
      port: '@PORT',
      security: {
        jwt: {
          secret: '@JWT_SECRET',
          issuer: 'localhost',
        },
      },
      database: {
        type: '@DB_TYPE',
        mongo: {
          database: {
            host: '@DB_HOST',
            port: '@DB_PORT',
            name: '@DB_NAME',
            user: '@DB_USER',
            pass: '@DB_PASS',
            prefix: '@DB_PRFX',
            cluster: '@DB_CLUSTER',
          },
        },
      },
      git: {
        install: false,
        use: false,
      },
      env: {},
    },
  };
  public static dockerSH = `
  #!/bin/bash

  port=@port
  appName=@appName

  docker stop $appName
  docker rm $appName
  docker rmi $appName

  docker build . -t $appName
  docker run -d -p $port:$port --mount source=$appName-vol,target=/app/uploads --env-file app.env --name $appName $appName
  `;
  public static dockerClearSH = `
  #!/bin/bash

  port=@port
  appName=@appName

  docker stop $appName
  docker rm $appName
  docker rmi $appName
  `;
}
