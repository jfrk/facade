# Facade

Makes it easier and more intuitive to work with state trees consisting of plain objects, arrays and primitive values. Use methods, getters and setters directly on the objects instead of selectors. Perfect to combine with [Immer](https://github.com/mweststrate/immer).

## Installation

```
npm install --save @jfrk/facade
```

## Usage example

```js
const { wrap, INDEX, ROOT } = require('@jfrk/facade')

// The state is a serializable, one-directional object tree consisting of plain objects, arrays and primitive values.
const state = {
  posts: [
    {
      id: '6NEN6Xuo',
      title: 'My first post',
      authorId: '7obJ6CwW',
      tags: ['foo', 'bar'],
    },
    {
      id: 'vu3KPoW7',
      title: 'My second post',
      authorId: '7obJ6CwW',
      tags: ['foo'],
    },
    {
      id: 'FocE8EQ7',
      title: 'My first post',
      authorId: 'N6TKjJ3M',
      tags: ['qux'],
    },
  ],
  authors: [
    {
      id: '7obJ6CwW',
      firstName: 'Jane',
      lastName: 'Doe',
    },
    {
      id: 'N6TKjJ3M',
      firstName: 'John',
      lastName: 'Smith',
    },
  ],
}

// We define a list of types used to enhance objects and arrays in the state tree. With these we can add getter, setters and methods.
let typeDefs = {
  State: {
    posts: 'PostList',
    author: 'AuthorList',
    getPost(id) {
      return this.posts.find(post => post.id === id)
    },
    getAuthor(id) {
      return this.authors.find(author => author.id === id)
    },
  },
  PostList: {
    [INDEX]: 'Post',
    getByTag(tag) {
      return this.filter(post => post.tags.includes(tag))
    },
  },
  Post: {
    get author() {
      return this[ROOT].getAuthor(this.authorId)
    },
  },
  AuthorList: {
    [INDEX]: 'Author',
  },
  Author: {
    get fullName() {
      return `${this.firstName} ${this.lastName}`
    },
    get posts() {
      return this[ROOT].posts.filter(
        post => post.authorId === this.id,
      )
    },
  },
}

// `wrap` is called with the type definitions, the type of the root object and state tree and returns a wrapped state.
let wrappedState = wrap(typeDefs, 'State', state)

// Example usage of the wrapped state:

wrappedState.getPost('vu3KPoW7').title
// 'My second post'

wrappedState.getPost('vu3KPoW7').author.fullName
// 'Jane Doe'

wrappedState.posts.getByTag('foo').length
// 2
```

### Combined with Immer

```js
import produce from 'immer'
import { wrap } from '@jfrk/facade'

let wrapper = wrap(
  {
    State: {
      // ...
    },
  },
  'State',
)

export default producer =>
  produce(draftState => {
    producer(wrapper(draftState))
  })
```

## API

### `wrap(typeDefs, rootType, rootObject)`

This function is curriable, which means that it can be called partially, for example to create a reusable wrapper:

```js
let wrapper = wrap(typeDefs, rootType)
let wrappedObject = wrapper(rootObject)
```

`wrap` is the default export but also availbale as a named export.

### Type definitions

- `{ propName: 'Type' }`

  When getting the prop `propName` on objects of this type, the value will be wrapped in the type `Type`.

- `{ [INDEX]: 'ElementType' }`

  When getting elements on arrays of this type, the element will be wrapped in the type `ElementType`. `INDEX` is a symbol provided by this package and matches any prop that is an integer on both arrays and objects.

- `{ methodName(...) { ... } }`

  Objects of this type will have a mathod availbale called `methodName`. Inside this function, `this` will be the wrapped object.

- `{ get propName() { return ... } }`

  When getting the prop `propName` on objects of this type, this getter will be used to calculate the value. Inside this function, `this` will be the wrapped object.

- `{ set propName(value) { ... } }`

  When setting the prop `propName` on objects of this type, this function will be used to set the value. Inside this function, `this` will be the wrapped object.

### Exported symbols

- `INDEX`

  Use this as a prop in a type definition to set a type for all array elements. Example:

  ```js
  {
    [INDEX]: 'ElementType'
  }
  ```

- `ROOT`

  Use this symbol on `this` inside a method to get the root object. Example:

  ```js
  {
    get rootObject() {
      return this[ROOT]
    }
  }
  ```

- `PARENT`

  Use this symbol on `this` inside a method to get the previously accessed object. Example:

  ```js
  {
    get parentObject() {
      return this[PARENT]
    }
  }
  ```

- `TYPE`

  Use this symbol on `this` inside a method to get the name of the object’s type. Example:

  ```js
  {
    get type() {
      return this[TYPE]
    }
  }
  ```

## Caveats

This package uses [Proxies](https://caniuse.com/#feat=proxy) and [Symbols](https://kangax.github.io/compat-table/es6/#test-Symbol), so it will not work in all browsers.
