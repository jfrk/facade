const { wrap, INDEX, ROOT, PARENT } = require('.')

describe('wrap', () => {
  it('handles getters', () => {
    let types = {
      Rect: {
        get area() {
          return this.width * this.height
        },
      },
    }
    let original = {
      width: 10,
      height: 40,
    }
    let wrapped = wrap(types, 'Rect', original)

    expect(wrapped.width).toEqual(original.width)
    expect(wrapped.area).toEqual(
      original.width * original.height,
    )
  })
  it('handles setters', () => {
    let types = {
      Rect: {
        set w(value) {
          this.width = value
        },
      },
    }
    let original = {
      width: 10,
      height: 40,
    }
    let wrapped = wrap(types, 'Rect', original)

    expect(wrapped.width).toEqual(original.width)
    wrapped.w = 100
    expect(wrapped.width).toEqual(100)
  })
  it('handles methods with return value', () => {
    let types = {
      Rect: {
        getArea() {
          return this.width * this.height
        },
      },
    }
    let original = {
      width: 10,
      height: 40,
    }
    let wrapped = wrap(types, 'Rect', original)

    expect(wrapped.width).toEqual(original.width)
    expect(wrapped.getArea()).toEqual(
      original.width * original.height,
    )
  })
  it('handles methods with return value', () => {
    let types = {
      Rect: {
        get area() {
          return this.width * this.height
        },
        getArea() {
          return this.area
        },
      },
    }
    let original = {
      width: 10,
      height: 40,
    }
    let wrapped = wrap(types, 'Rect', original)

    expect(wrapped.width).toEqual(original.width)
    expect(wrapped.getArea()).toEqual(
      original.width * original.height,
    )
  })
  it('handles mutating methods', () => {
    let types = {
      Rect: {
        setWidth(value) {
          this.width = value
        },
      },
    }
    let original = {
      width: 10,
      height: 40,
    }
    let wrapped = wrap(types, 'Rect', original)

    expect(wrapped.width).toEqual(original.width)
    wrapped.setWidth(100)
    expect(wrapped.width).toEqual(100)
  })
  it('handles object tree', () => {
    let types = {
      Post: {
        author: 'Author',
      },
      Author: {
        get fullName() {
          return `${this.firstName} ${this.lastName}`
        },
      },
    }
    let original = {
      title: 'My blog post',
      author: {
        firstName: 'Fredrik',
        lastName: 'Johansson',
      },
    }
    let wrapped = wrap(types, 'Post', original)

    expect(wrapped.title).toEqual(original.title)
    expect(wrapped.author.fullName).toEqual(
      `${original.author.firstName} ${
        original.author.lastName
      }`,
    )
  })
  it('handles getting of array element', () => {
    let types = {
      PersonList: {
        [INDEX]: 'Person',
      },
      Person: {
        get fullName() {
          return `${this.firstName} ${this.lastName}`
        },
      },
    }
    let original = [
      {
        firstName: 'Fredrik',
        lastName: 'Johansson',
      },
      {
        firstName: 'John',
        lastName: 'Smith',
      },
    ]
    let wrapped = wrap(types, 'PersonList', original)

    expect(wrapped[0].fullName).toEqual(
      `${original[0].firstName} ${original[0].lastName}`,
    )
    expect(wrapped.map(person => person.fullName)).toEqual(
      original.map(
        person => `${person.firstName} ${person.lastName}`,
      ),
    )
  })
  it('handles PARENT symbol', () => {
    let types = {
      MenuItemList: {
        [INDEX]: 'MenuItem',
      },
      MenuItem: {
        items: 'MenuItemList',
        get parent() {
          if (this[PARENT]) {
            return this[PARENT][PARENT]
          }
        },
        get path() {
          if (this.parent) {
            return [...this.parent.path, this]
          }
          return [this]
        },
        get breadcrumbString() {
          return this.path.map(item => item.label).join('/')
        },
      },
    }
    let original = {
      label: 'Home',
      items: [
        {
          label: 'Products',
          items: [
            {
              label: 'Product A',
              items: [],
            },
            {
              label: 'Product B',
              items: [],
            },
            {
              label: 'Product C',
              items: [],
            },
          ],
        },
        {
          label: 'About',
          items: [],
        },
        {
          label: 'Contact',
          items: [],
        },
      ],
    }
    let wrapped = wrap(types, 'MenuItem', original)

    expect(
      wrapped.items[0].items[0].breadcrumbString,
    ).toEqual('Home/Products/Product A')
  })
})

describe('README example', () => {
  it('works', () => {
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

    let typeDefs = {
      State: {
        posts: 'PostList',
        author: 'AuthorList',
        getPost(id) {
          return this.posts.find(post => post.id === id)
        },
        getAuthor(id) {
          return this.authors.find(
            author => author.id === id,
          )
        },
      },
      PostList: {
        [INDEX]: 'Post',
        getByTag(tag) {
          return this.filter(post =>
            post.tags.includes(tag),
          )
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

    let wrappedState = wrap(typeDefs, 'State', state)

    wrappedState.getPost('vu3KPoW7').title
    // 'My second post'

    wrappedState.posts.getByTag('foo').length
    // 2

    wrappedState.getPost('vu3KPoW7').author.fullName
    // 'Jane Doe'
  })
})
