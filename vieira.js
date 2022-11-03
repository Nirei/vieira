#!/bin/env node
const repl = require('repl')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const DEFAULT_PROMPT = '$ '
const DEFAULTS_FILE = '.vieirarc.js'

function labelCommand(label, command) {
  Object.defineProperty(command, 'name', {
    value: label,
    configurable: true,
  })
}

function commandFunctionExecuteToBuffer(shell) {
  return function (input, ...args) {
    result = spawnSync(input.metadata.command, args, {
      env: shell.context.env,
      cwd: shell.context.cwd,
      shell: true,
    })
    return result.stdout?.toString()?.trim()
  }
}

function executableCommand(dir, filename) {
  const filePath = path.join(dir, filename)
  return {
    path: filePath,
    filename: filename,
    command: path.parse(filePath).name,
  }
}

function commandFunction(shell, metadata) {
  const fn = (...args) => {
    spawnSync(metadata.command, args, {
      env: shell.context.env,
      cwd: shell.context.cwd,
      shell: true,
      stdio: 'inherit',
    })
  }
  labelCommand(metadata.command, fn)
  Object.defineProperty(fn, 'metadata', {
    value: metadata,
    configurable: true,
  })
  return fn
}

function isExecutable(file) {
  try {
    fs.accessSync(file, fs.constants.X_OK)
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

function findExecutables() {
  return process.env.path.split(';').flatMap((dir) => {
    try {
      return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((dirent) => dirent.isFile())
        .map((dirent) => executableCommand(dir, dirent.name))
        .filter((executable) => isExecutable(executable.path))
    } catch (e) {
      return []
    }
  })
}

function updatePrompt(shell) {
  const generator = shell?.context?.prompt
  const type = typeof generator
  shell.setPrompt(type == 'function' ? generator() : generator)
}

function evalWrapper(shell) {
  const oldEval = shell.eval
  return (cmd, context, filename, callback) => {
    let error, output
    const result = oldEval(
      cmd,
      context,
      filename,
      (errorValue, outputValue) => {
        error = errorValue
        output = outputValue
      },
    )
    updatePrompt(shell)
    callback(error, output)
    return result
  }
}

function loadDefaults(shell) {
  const data = fs.readFileSync(DEFAULTS_FILE)
  // Evil hack to load defaults >:)
  shell.eval(data, shell.context, DEFAULTS_FILE, () => {})
}

function main() {
  const executables = findExecutables()
  const shell = repl.start({
    prompt: "",
    ignoreUndefined: true,
  })
  shell.pause()
  shell.eval = evalWrapper(shell, shell.eval)
  shell.context.prompt = DEFAULT_PROMPT
  shell.context.cwd = process.cwd()
  shell.context.cd = (dir) => { shell.context.cwd = path.resolve(shell.context.cwd, dir) }
  labelCommand('cd', shell.context.cd)
  shell.context.env = { ...process.env }
  shell.context.$ = commandFunctionExecuteToBuffer(shell)
  // Shitty hack to have aliasing D:
  shell.context.alias = (name, closure) => {
    shell.context[name] = (...args) => closure.call(shell.executables, args)
  }
  shell.executables = {}
  executables.forEach((metadata) => {
    shell.executables[metadata.command] = commandFunction(shell, metadata)
    shell.context[metadata.command] = commandFunction(shell, metadata)
  })
  loadDefaults(shell)
  shell.displayPrompt()
}

main()
