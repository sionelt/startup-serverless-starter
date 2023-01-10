import {RemovalPolicy, aws_lambda} from 'aws-cdk-lib'
import fs from 'fs-extra'
import path from 'path'
import {Config, Stack, StackContext} from 'sst/constructs'
import packageJson from '../../package.json'

export function Database({stack, app}: StackContext) {
  const arm64Layer = prismaBinaryLayer(stack, 'ARM_64')
  const x86Layer = prismaBinaryLayer(stack, 'X86_64')

  app.setDefaultFunctionProps({
    bind: [
      new Config.Secret(stack, 'DATABASE_URL'),
      new Config.Secret(stack, 'UPSTASH_REDIS_REST_TOKEN'),
      new Config.Parameter(stack, 'UPSTASH_REDIS_REST_URL', {
        value: 'https://global-obliging-chimp-31301.upstash.io',
      }),
    ],
    copyFiles: [{from: 'database/schema.prisma', to: 'schema.prisma'}],
    nodejs: {
      esbuild: {
        external: ['@prisma/client/runtime'],
      },
      /**
       * Solve issues with dynamic imports in EsModule
       * @link https://github.com/evanw/esbuild/pull/2067#issuecomment-1073039746
       * @link https://github.com/prisma/prisma/issues/14484
       * @link https://github.com/jetbridge/sst-prisma
       */
      banner: `await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname='/var/task'),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();`,
    },
  })

  //TODO: Create KMS key for encryptions

  return {
    x86Layer,
    arm64Layer,
  }
}

/**
 * @credit https://github.com/jetbridge/sst-prisma
 */
function prismaBinaryLayer(stack: Stack, architecture: 'ARM_64' | 'X86_64') {
  const version = packageJson.devDependencies.prisma.replace(/[^\d.]/g, '')
  // Hash and store zip as artifacts in GH actions
  const layerPath = `.sst/lambda_layers/prisma_${version}_${architecture}`

  // Remove existing layers
  fs.removeSync(layerPath)
  fs.mkdirSync(layerPath, {recursive: true})

  // Copy needed files
  const directoriesToCopy = [
    'node_modules/.prisma',
    'node_modules/@prisma/client/runtime',
  ]
  for (const file of directoriesToCopy) {
    const destination = path.join(layerPath, 'nodejs', file)
    fs.copySync(file, destination, {
      filter: (src: string) => {
        const notBinaryFile = !src.endsWith('.node')
        const matchedBinaryFile = {
          ARM_64: /linux-arm64/g.test(src),
          X86_64: /rhel-openssl/g.test(src),
        }[architecture]

        return notBinaryFile || matchedBinaryFile
      },
    })
  }

  return new aws_lambda.LayerVersion(
    stack,
    `${stack.stage}Prisma${version}${architecture}`,
    {
      removalPolicy: RemovalPolicy.DESTROY,
      code: aws_lambda.Code.fromAsset(path.resolve(layerPath)),
      compatibleRuntimes: [aws_lambda.Runtime.NODEJS_16_X],
      compatibleArchitectures: [aws_lambda.Architecture[architecture]],
    }
  )
}
