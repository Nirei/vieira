prompt = () => `\x1b[32m${$(whoami)}\x1b[m @ \x1b[32m${$(hostname)}\x1b[m \x1b[30;1m${cwd}\x1b[m $ `

alias("ls", function (...args) { return this.ls('--color=always', ...args) })
alias("grep", function (...args) { return this.grep('--color=always', ...args) })