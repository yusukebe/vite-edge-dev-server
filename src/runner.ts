import { ssrDynamicImportKey, ssrExportAllKey, ssrImportKey, ssrImportMetaKey, ssrModuleExportsKey } from 'vite/runtime'
import type { ViteModuleRunner, ViteRuntimeModuleContext } from 'vite/runtime'
import { EdgeVM } from '@edge-runtime/vm'
import { makeLegalIdentifier } from '@rollup/pluginutils'

export class EdgeRunner implements ViteModuleRunner {
  private vm!: EdgeVM

  async setup() {
    this.vm = new EdgeVM({
      codeGeneration: {
        strings: false,
        wasm: false
      }
    })
  }

  async runViteModule(context: ViteRuntimeModuleContext, code: string, id: string): Promise<any> {
    delete context[ssrImportMetaKey].filename
    delete context[ssrImportMetaKey].dirname

    const funcName = makeLegalIdentifier(id)
    const initModule = this.vm.evaluate(
      `(async function ${funcName}(${ssrModuleExportsKey},${ssrImportMetaKey},${ssrImportKey},${ssrDynamicImportKey},${ssrExportAllKey}){"use strict";${code}})`
    )
    await initModule(
      context[ssrModuleExportsKey],
      context[ssrImportMetaKey],
      context[ssrImportKey],
      context[ssrDynamicImportKey],
      context[ssrExportAllKey]
    )
    Object.freeze(context[ssrModuleExportsKey])
  }

  runExternalModule(_filepath: string): Promise<any> {
    throw new Error('Not supported')
  }
}
