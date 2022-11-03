## What's this?

Vieira is a series of hacks to bend Node's native `REPL` module into a mediocre OS shell that understands JS. The name
comes from the Galician name for a scallop, which as you know is a _shellfish_... (Sorry, not sorry).

I implemented Vieira in an effort to Rube-Goldberg my way into proving to myself that I can just live with _bash_ or
_zsh_ and not typing `()` after every command. It was very effective: I only typed in a few test commands and I'm
already tired of it.

Anyway, if after reading this you still want to give it a go, next come some tips. And I sincerely hope you have fun. :)

### Launch

Simply obtain a copy of the source code, then run it like this:

```sh
$ node vieira.js
```

or give it executable permissions if you are feeling brave:

```sh
$ chmod +x vieira.js
```

and then launch it like this:

```sh
$ ./vieira.js
```

### Usage

Vieira will scan every executable file in your `$PATH` and add it as a command to the Node REPL context. That means you
can call commands like this:

```js
> ls('-a')
. .. .vieirarc.js LICENSE README.md vieira.js
```

or this...

```js
> echo('Hello world!')
Hello world!
```

and of course you can do all the usual JS things like...

```js
> ['this', 'is', 'an', 'exercise', 'in'].map(element => element + ' ').join('') + 'futility'
'this is an exercise in futility'
```

Most commands will simply write their stuff to `stdout` but if you are feeling wild and want to try to capture that
output to a string for processing, Vieira has you covered, simply use the `$` function:

```js
> $(echo, 'wow such string! much convoluted!')
'wow such string! much convoluted!'
```

#### Prompts

Vieira provides the oh-so-amazing ability to customize your prompt. You can simply set the `prompt` variable like
this:

```js
> prompt = '$ '
```

Or even set it to a function that will be executed every time to have dynamic prompts:

```js
> prompt = () => `${$(whoami)}`
```

#### Alias

You can define alias through an extremely ugly hack that doesn't make much sense but whatever:

```js
// The `this` will hold the original command reference to prevent a stack overflow caused by infinite recursion.
// Sad, I know.
alias('name', function (...args) { return this.whatever('some custom arg', ...args) } )
```

This is only good for redefining existing commands, such as `ls`. If you just want a custom command simply save it to a
toplevel variable and you are good to go, no need to do an alias for that.

#### Defaults

Vieira will load the `.vieirarc.js` file on load. You can use it to define a custom prompt, set aliases or whatever you
want to do on startup. A default with some example config is included.
