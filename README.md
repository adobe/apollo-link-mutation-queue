# apollo-link-mutation-queue

An Apollo link that enqueues mutations so that they do not fire in parallel.

## Goals

I was finding that mutations affecting the same underlying data would often
return incorrect data if fired in parallel. Instead of blocking UI based on the
loading state of the mutations I wrote a link that just enqueues mutations.

### Usage

Compose your link chain with the link.

```js
import MutationQueueLink from "apollo-link-mutation-queue";

const link = ApolloLink.from([
  new MutationQueueLink()
  //... your other links
]);
```

Debug with `debug: true`.

```js
import MutationQueueLink from "apollo-link-mutation-queue";

const link = ApolloLink.from([
  new MutationQueueLink({ debug: true })
  //... your other links
]);
```

Cut in line with `skipQueue: true`.

```js
const [mutate] = useMutation(MY_MUTATION);

useEffect(() => {
  mutate({
    context: { skipQueue: true }
  });
}, []);
```

### Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
