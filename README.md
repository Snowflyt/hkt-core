<h1 align="center"><span style="color: mediumseagreen">hkt</span>-core</h1>

<p align="center">
🍃 A micro <strong>HKT (higher-kinded type)</strong> implementation for TypeScript, with <strong style="color: seagreen">type safety</strong> elegantly guaranteed.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hkt-core">
    <img src="https://img.shields.io/npm/dm/hkt-core.svg" alt="downloads" height="18">
  </a>
  <a href="https://www.npmjs.com/package/hkt-core">
    <img src="https://img.shields.io/npm/v/hkt-core.svg" alt="npm version" height="18">
  </a>
  <a href="https://github.com/Snowflyt/hkt-core/actions/workflows/test.yml">
    <img src="https://github.com/Snowflyt/hkt-core/actions/workflows/test.yml/badge.svg" alt="test status" height="18">
  </a>
  <a href="https://github.com/gvergnaud/hkt-core">
    <img src="https://img.shields.io/npm/l/hkt-core.svg" alt="MIT license" height="18">
  </a>
</p>

```typescript
/* Use as classical HKTs (e.g., fp-ts style) */
interface MonadTypeClass<F extends HKT> {
  of: <T>(a: T) => Kind<F, T>; // Lift a value into the monad
  flatMap: <T, U>(fa: Kind<F, T>, f: (a: T) => Kind<F, U>) => Kind<F, U>;
}

// Create a `flatten` function for a monad from a monad type class
const createFlatten =
  <F extends HKT>(monad: MonadTypeClass<F>) =>
  <T>(ffa: Kind<F, Kind<F, T>>): Kind<F, T> =>
    monad.flatMap(ffa, (x) => x);

/* Use as type-level functions (e.g., HOTScript style) */
type ConcatNames<Names extends string[]> = Pipe<
  Names, // [1]
  Filter<Flow<StringLength, NotExtend<1 | 2>>>, // Filter out short names
  Map<CapitalizeString>, // Capitalize each name
  JoinBy<", "> // Join names with a comma
>;

type _ = ConcatNames<["alice", "bob", "i"]>; // => "Alice, Bob"
```

<small>[1]: This is just an example to demonstrate type-level functions. Some types used here (e.g., <code>Filter</code>, <code>Map</code>) are not built into hkt-core. See the following sections for more details.</small>

## About

**Higher-Kinded Types (HKT)** are a powerful concept used in many popular TypeScript libraries, including [fp-ts](https://github.com/gcanti/fp-ts/blob/669cd3ed7cb5726024331a7a1cf35125669feb30/src/HKT.ts#L7-L70), [Effect](https://github.com/Effect-TS/website/blob/115da7cebb6ff3e4a266d47c8cbd37900219479b/content/limbo/hkt.mdx), [TypeBox](https://github.com/sinclairzx81/typebox/blob/870ab417fb69775e3b490d4457aa5963b6f16673/src/type/schema/schema.ts#L52-L58) and [HOTScript](https://github.com/gvergnaud/hotscript/blob/0bc205286bd5eea0b89fa903c411df9aca95923c/src/internals/core/Core.ts#L29-L37). While these libraries share the core idea of HKTs, their detailed implementations differ, making it difficult to share HKTs across libraries seamlessly.

**hkt-core** solves this problem by providing a **standardized** and **type-safe** HKT implementation that works for **both classical HKT use cases** (like fp-ts) and **type-level functions** (like HOTScript). Designed for easy integration with other libraries, it’s a **micro-library** that focuses solely on core HKT functionality without unnecessary extras.

Regarding the type-level functions use case, **hkt-core** also aims for **_zero-cost_ abstractions** — the type computations are **optimized** to be as efficient as possible. By using **hkt-core**, you get a more concise way to write type-level code without worrying about slowing down TypeScript's compilation.

## Installation

To install **hkt-core** via npm (or any other package manager you prefer):

```shell
npm install hkt-core
```

Alternatively, if you prefer a zero-dependency approach, you can directly _copy-and-paste_ **`src/HKT.ts`** into your project, which contains all **hkt-core**’s code in a single file. We guarantee **_no_ breaking changes** in **releases** _without_ a major version bump.

> [!WARNING]
>
> However, currently **hkt-core** is still a work-in-progress project, so **breaking changes** _are_ expected in its API without notice. Therefore, as for now, it’s recommended to use the npm package and pin the version in your `package.json` to ensure the stability of your project.

## Examples

**hkt-core** introduces some concepts that might take a little time to fully grasp. To get the most out of it, we recommend following the [quickstart guide](#quickstart) from start to finish. However, if you’re eager to jump straight into examples, we’ve provided a few here as TypeScript playground links. These examples will give you a quick overview of what **hkt-core** can do:

- [Create a monad typeclass with HKT](https://tsplay.dev/w8eZ9N) (like in [fp-ts](https://github.com/gcanti/fp-ts))
- [Composable type-level function programming with HKTs](https://tsplay.dev/NldbrN) (like in [HOTScript](https://github.com/gvergnaud/HOTScript), but in a type-safe way)
- [A type-level JSON parser with parser combinators](https://tsplay.dev/wRkYvN) (like in Haskell [Parsec](https://hackage.haskell.org/package/parsec))

## Quickstart

This section demonstrates how to use **hkt-core** in two common scenarios: **classical HKTs** (like in fp-ts) and **type-level functions** (like in HOTScript).

### Use as classical HKTs 🐱

> [!TIP]
>
> This section assumes familiarity with **monads** and **type classes**. If you’re new to these concepts, we recommend checking out the [fp-ts documentation](https://gcanti.github.io/fp-ts/) first — or feel free to skip to the next section, which is more beginner-friendly.

Let’s start with a **monad** example. A monad is a container type that supports **`flatMap`** (also known as **`chain`**) and **`of`** (also known as **`pure`** or **`return`**). For example, both **`Array`** and **`Option`** are monads because they support these operations. Since TypeScript doesn’t have a built-in **`Option`** type, let’s define one first:

```typescript
type Option<T> = { _tag: "Some"; value: T } | { _tag: "None" };
const some = <T>(value: T): Option<T> => ({ _tag: "Some", value });
const none: Option<never> = { _tag: "None" };
```

Next, let’s define **`of`** and **`flatMap`** for both **`Array`** and **`Option`**. We’ll use an object to represent a monad (a monad type class):

```typescript
const arrayMonad = {
  of: <T>(a: T) => [a],
  flatMap: <T, U>(fa: T[], f: (a: T) => U[]) => fa.flatMap(f),
};

const optionMonad = {
  of: some,
  flatMap: <T, U>(fa: Option<T>, f: (a: T) => Option<U>) =>
    fa._tag === "Some" ? f(fa.value) : none,
};
```

Now, let’s define a **`flatten`** function for a monad. Notice that **`flatten`** can be derived from **`flatMap`**:

```typescript
const flattenArray = <T>(ffa: T[][]): T[] => arrayMonad.flatMap(ffa, (x) => x);
const flattenOption = <T>(ffa: Option<Option<T>>): Option<T> => optionMonad.flatMap(ffa, (x) => x);
```

To avoid writing separate **`flatten`** functions for each monad, we can create a **`createFlatten`** function that generates a **`flatten`** function from a monad:

```typescript
const createFlatten = (monad) => (ffa) => monad.flatMap(ffa, (x) => x);

const flattenArray = createFlatten(arrayMonad);
const flattenOption = createFlatten(optionMonad);
```

The challenge is how to type **`createFlatten`** correctly. Ideally, **`createFlatten`** should accept a monad type class for a generic monad type **`F<~>`**, where **`F`** is a higher-kinded type. If TypeScript supported higher-kinded types natively, we could write something like this:

```typescript
interface MonadTypeClass<F<~>> {
  of: <T>(a: T) => F<T>;
  flatMap: <T, U>(fa: F<T>, f: (a: T) => F<U>) => F<U>;
}

const arrayMonad: MonadTypeClass<Array<~>> = /* ... */;
const optionMonad: MonadTypeClass<Option<~>> = /* ... */;

const createFlatten =
  <F<~>>(monad: MonadTypeClass<F>) =>
  <T>(ffa: F<F<T>>): F<T> =>
    monad.flatMap(ffa, (x) => x);
```

We can think of **HKTs** as functions that operate on types, or as type constructors in Haskell terms (represented as **`* -> *`**). For example:

- In Haskell, **`Maybe`** is a type constructor of kind **`* -> *`**. It takes a type **`a`** (like **`Int`**) and returns a new type **`Maybe a`** (like **`Maybe Int`**).
- Similarly, **`List`** is a type constructor of kind **`* -> *`**. It takes a type **`a`** and returns a new type **`[a]`** (a list of **`a`**).

In the code above, **`F<~>`** represents such a type constructor. The **`MonadTypeClass`** accepts a type constructor **`F`** and uses **`F<T>`** to map a type **`T`** to a new type **`F<T>`**. For example:

- If **`F`** is **`Array`**, then **`F<number>`** is **`Array<number>`**.
- If **`F`** is **`Option`**, then **`F<string>`** is **`Option<string>`**.

We have seen the power of HKTs in action. Unfortunately, TypeScript doesn’t natively support this syntax. However, **hkt-core** provides a way to simulate it:

```typescript
import { Apply, Arg0, TypeLambda1, Call1 } from "hkt-core";

// We use untyped `TypeLambda`s for now,
// see the next section for typed `TypeLambda`s
interface ArrayHKT extends TypeLambda1 {
  return: Array<Arg0<this>>;
}
interface OptionHKT extends TypeLambda1 {
  return: Option<Arg0<this>>;
}

type NumberArray = Apply<ArrayHKT, [number]>; // => Array<number>
type StringOption = Call1<OptionHKT, string>; // => Option<string>
```

<strong><code>TypeLambda</code></strong>s are the core building blocks of **hkt-core**. They represent **type-level functions** that operate on types. Here, we use **`TypeLambda1`** because both **`Array`** and **`Option`** are type constructors that take **one type argument**. To extract the type arguments passed to a **`TypeLambda`**, we use utility types like **`Args`**, **`Arg0`**, **`Arg1`**, etc.

As shown above, we can “invoke” a **`TypeLambda`** with type arguments using **`Apply`** or its aliases like **`Call1`**, **`Call2`**, etc, which correspond to type-level functions that take exactly one, two, or more type arguments. These work similarly to **`Function.prototype.apply`** and **`Function.prototype.call`** in JavaScript.

For classical HKT use cases, **hkt-core** provides concise aliases like **`HKT`** and **`Kind`**, which can be seen as aliases for **`TypeLambda1`** and **`Call1`** (**`Kind`** is actually an alias for **`Call1W`**, see the [Aliases for classical HKT use cases](#aliases-for-classical-hkt-use-cases) section for details). Using these aliases, we can define a **`MonadTypeClass`** and **`createFlatten`** function like this:

```typescript
import { Arg0, HKT, Kind } from "hkt-core";

interface MonadTypeClass<F extends HKT> {
  of: <T>(a: T) => Kind<F, T>;
  flatMap: <T, U>(fa: Kind<F, T>, f: (a: T) => Kind<F, U>) => Kind<F, U>;
}

const createFlatten =
  <F extends HKT>(monad: MonadTypeClass<F>) =>
  <T>(ffa: Kind<F, Kind<F, T>>): Kind<F, T> =>
    monad.flatMap(ffa, (x) => x);

interface ArrayHKT extends HKT {
  return: Array<Arg0<this>>;
}
const arrayMonad: MonadTypeClass<ArrayHKT> = {
  of: (a) => [a],
  flatMap: (fa, f) => fa.flatMap(f),
};

interface OptionHKT extends HKT {
  return: Option<Arg0<this>>;
}
const optionMonad: MonadTypeClass<OptionHKT> = {
  of: some,
  flatMap: (fa, f) => (fa._tag === "Some" ? f(fa.value) : none),
};

const flattenArray = createFlatten(arrayMonad);
//    ^?: <T>(ffa: T[][]) => T[]
const flattenOption = createFlatten(optionMonad);
//    ^?: <T>(ffa: Option<Option<T>>) => Option<T>
```

This code achieves the same functionality as the imaginary syntax above, but it works in real TypeScript. By defining **`ArrayHKT`** and **`OptionHKT`** and using **`HKT`** and **`Kind`**, we can simulate higher-kinded types effectively.

### Use as type-level functions ✨

**hkt-core** isn’t just for type constructors — it also supports **_typed_ type-level functions**, which go beyond **`* -> *`** to enable **`TypeA -> TypeB`** transformations. This makes it possible to combine _type-level_ functions with **type-safety**, including **_generic_ type-level functions**!

> [!TIP]
>
> **_Generic_ type-level functions** are a powerful feature and make up almost half of **hkt-core**’s codebase. However, due to their complexity, they are not covered in this quickstart guide. If you are curious, check out the [Generic type-level functions](#generic-type-level-functions) section after finishing this guide.

Let’s start with a JavaScript example: suppose we have an array of employee names, and we want to filter out names that are too short (which might be a bug in the data), capitalize the first letter of each name, and then join the names with a comma. We can write a function like this:

```typescript
const capitalize = (s: string) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : "");

const concatNames = (names: string[]) =>
  names
    .filter((name) => name.length > 2)
    .map(capitalize)
    .join(", ");
```

In functional programming libraries like [fp-ts](https://gcanti.github.io/fp-ts/), this can be rewritten using **function composition**:

```typescript
import { pipe } from "fp-ts/function";
import { filter, map } from "fp-ts/Array";

const joinBy = (sep: string) => (strings: string[]) => strings.join(sep);

const concatNames = (names: string[]) =>
  pipe(
    names,
    filter((name) => name.length > 2),
    map(capitalize),
    joinBy(", "),
  );
```

Here, **`filter`**, **`map`**, and **`join`** are higher-order functions that return new unary functions, and **`pipe`** chains them together. For example, **`pipe(value, f, g, h)`** is equivalent to **`h(g(f(value)))`**. Similarly, **`flow`** can be used to create a composed function in **fp-ts**, e.g., **`flow(f, g, h)`** is equivalent to **`(value) => h(g(f(value)))`**.

But how can we implement such a function at **type level**? While the employee names example might seem trivial at type level, consider a real-world use case: replacing names with route paths, the predicate with a route prefix, and the join function with a router builder. This becomes a type-safe routing system! For now, let’s focus on the employee names example.

A practiced TypeScript developer might write the following type-level implementation:

```typescript
type FilterOutShortNames<Names extends string[]> =
  Names extends [infer Head extends string, ...infer Tail extends string[]] ?
    Head extends `${infer A}${infer B}${infer C}` ?
      "" extends A | B | C ?
        FilterOutShortNames<Tail>
      : [Head, ...FilterOutShortNames<Tail>]
    : FilterOutShortNames<Tail>
  : [];

type CapitalizeNames<Names extends string[]> = {
  [K in keyof Names]: Capitalize<Names[K]>;
};

type JoinNames<Names extends string[]> =
  Names extends [infer Head extends string, ...infer Tail extends string[]] ?
    Tail extends [] ?
      Head
    : `${Head}, ${JoinNames<Tail>}`
  : "";

type ConcatNames<Names extends string[]> = JoinNames<CapitalizeNames<FilterOutShortNames<Names>>>;
```

While this works, it’s **_not_ reusable**. We can identify several common patterns here:

- **Filter tuple elements:** Recursive types with predicates, like **`FilterOutShortNames`**.
- **Map tuple elements:** Mapped types, like **`CapitalizeNames`**.
- **Reduce tuple elements:** Recursive types to reduce a tuple to a single value, like **`JoinNames`**.

If we continue writing such code, we’ll end up with a lot of boilerplate. Just as higher-order functions like **`filter`**, **`map`**, and **`reduce`** simplify JavaScript code, **hkt-core** enables us to implement these patterns with **type-level functions** in TypeScript. But before diving into implementing these familiar functions, let’s first explore how **type-level functions** work in **hkt-core**.

<strong><code>TypeLambda</code></strong>s are the core building blocks of **hkt-core**. They represent **type-level functions** that operate on types. To define a type-level function, we can create an interface extending **`TypeLambda`** and specify the **`return`** property, which describes how the input type is transformed:

```typescript
import { Apply, Arg0, Arg1, Call2, Sig, TypeLambda } from "hkt-core";

interface Concat extends TypeLambda<[s1: string, s2: string], string> {
  return: `${Arg0<this>}${Arg1<this>}`;
}

// Use the `Sig` utility to check the signature of a type-level function
type ConcatSig = Sig<Concat>; // => (s1: string, s2: string) => string

type _1 = Apply<Concat, ["Hello", "World"]>; // => "HelloWorld"
type _2 = Call2<Concat, "foo", "bar">; // => "foobar"
```

Inside a **`TypeLambda`**, we can access the input types using **`Args<this>`** and its variants like **`Arg0<this>`**, **`Arg1<this>`**, etc. To “invoke” a **`TypeLambda`**, we use **`Apply`** or its aliases like **`Call1`**, **`Call2`**, etc., which correspond to type-level functions that take exactly one, two, or more type arguments. These utilities work similarly to **`Function.prototype.apply`** and **`Function.prototype.call`** in JavaScript.

It’s worth noting that the **`Concat`** type-level function we created above is **`typed`**, meaning the input types are strictly checked. We declared the parameters as **`[s1: string, s2: string]`** and the return type as **`string`**. The parameters are represented as a [labeled tuple](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#labeled-tuple-elements) — these labels are just used by **`Sig`** to generate a human-readable signature and do not affect type checking or validation. You can remove them if you prefer.

If the input types don’t match the expected types, TypeScript will issue an error:

```typescript
type ConcatWrong1 = Apply<Concat, ["foo", 42]>;
//                                ~~~~~~~~~~~
// Type '["foo", 42]' does not satisfy the constraint '[s1: string, s2: string]'.
//   Type at position 1 in source is not compatible with type at position 1 in target.
//     Type 'number' is not assignable to type 'string'.

type ConcatWrong2 = Call2<Concat, "foo", 42>;
//                                       ~~
//             Type 'number' does not satisfy the constraint 'string'.
```

For more details on type checking and validation (e.g., how incompatible arguments are handled and how to bypass strict type checking), check out the [Type checking and validation in Detail](#type-checking-and-validation-in-detail) section.

**hkt-core** also provides type-level **`Flow`** and **`Pipe`** utility types to compose unary type-level functions. These types work similarly to **`pipe`** and **`flow`** in **fp-ts**:

```typescript
interface ConcatFoo extends TypeLambda<[s: string], string> {
  return: `${Arg0<this>}foo`;
}
interface ConcatBar extends TypeLambda<[s: string], string> {
  return: `${Arg0<this>}bar`;
}

type Composed = Flow<ConcatFoo, ConcatBar>;
type ComposedSig = Sig<Composed>; // => (s: string) => string
type _1 = Call1<Composed, "hello">; // => "hellofoobar"

type ConcatFooBar<S extends string> = Pipe<S, ConcatFoo, ConcatBar>;
type _2 = ConcatFooBar<"hello">; // => "hellofoobar"
```

<strong><code>Flow</code></strong> and **`Pipe`** supports up to 16 variadic type arguments, which should be sufficient for most use cases. Type checking is also performed on these utility types, ensuring that the input and output types match the expected types:

```typescript
interface Add1 extends TypeLambda<[n: number], number> {
  return: [..._BuildTuple<Arg0<this>, void>, void]["length"];
}
type _BuildTuple<Length extends number, Fill, Acc extends Fill[] = []> =
  [Length] extends [never] ? never
  : Acc["length"] extends Length ? Acc
  : _BuildTuple<Length, Fill, [...Acc, Fill]>;

type ComposedWrong = Flow<ConcatFoo, Add1, ConcatBar>;
//                                   ~~~~
// Type 'Add1' does not satisfy the constraint 'TypeLambda1<string, any>'.
//   Types of property 'signature' are incompatible.
//     Type '(n: number) => number' is not assignable to type '(args_0: string) => any'.
//       Types of parameters 'n' and 'args_0' are incompatible.
//         Type 'string' is not assignable to type 'number'.

type ConcatFooBarWrong<S extends string> = Pipe<S, ConcatFoo, ConcatBar, Add1>;
//                                                                       ~~~~
// Type 'Add1' does not satisfy the constraint 'TypeLambda1<string, any>'.
//   Types of property 'signature' are incompatible.
//     Type '(n: number) => number' is not assignable to type '(args_0: string) => any'.
//       Types of parameters 'n' and 'args_0' are incompatible.
//         Type 'string' is not assignable to type 'number'.
```

While strict type checking on type-level functions might seem restrictive in simple examples, it becomes a powerful tool for catching errors early when working with more complex types.

Now let’s revisit the employee names example. With the knowledge we’ve gained, we can implement the type-level functions **`Filter`**, **`Map`**, and **`Join`**, and then compose them into a **`ConcatNames`** type-level function

```typescript
/* Define utility type-level functions */
interface NotExtend<U> extends TypeLambda<[x: unknown], boolean> {
  return: [Arg0<this>] extends [U] ? false : true;
}

interface StringLength extends TypeLambda<[s: string], number> {
  return: _StringLength<Arg0<this>>;
}
type _StringLength<S extends string, Acc extends void[] = []> =
  S extends `${string}${infer Tail}` ? _StringLength<Tail, [...Acc, void]> : Acc["length"];

interface CapitalizeString extends TypeLambda<[s: string], string> {
  return: Capitalize<Arg0<this>>;
}

/* Define type-level functions for filtering, mapping and joining */
interface Filter<F extends TypeLambda1<never, boolean>>
  extends TypeLambda<[xs: Param0<F>[]], Param0<F>[]> {
  return: _Filter<F, Arg0<this>>;
}
type _Filter<F, TS, Acc extends unknown[] = []> =
  TS extends [infer Head, ...infer Tail] ?
    Call1W<F, Head> extends true ?
      _Filter<F, Tail, [...Acc, Head]>
    : _Filter<F, Tail, Acc>
  : Acc;

interface Map<F extends TypeLambda1> extends TypeLambda<[xs: Param0<F>[]], RetType<F>[]> {
  return: _Map<F, Arg0<this>>;
}
type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

interface JoinBy<Sep extends string> extends TypeLambda<[strings: string[]], string> {
  return: Arg0<this> extends [infer S extends string] ? S
  : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
    `${Head}${Sep}${Call1<JoinBy<Sep>, Tail>}`
  : "";
}

/* We can use either `Flow` or `Pipe` to compose type-level functions */
type ConcatNamesFn = Flow<
  Filter<Flow<StringLength, NotExtend<1 | 2>>>,
  Map<CapitalizeString>,
  JoinBy<", ">
>;
type ConcatNamesSig = Sig<ConcatNamesFn>; // => (xs: string[]) => string

type ConcatNames<Names extends string[]> = Pipe<
  Names,
  Filter<Flow<StringLength, NotExtend<1 | 2>>>,
  Map<CapitalizeString>,
  JoinBy<", ">
>;

/* Test the results! */
type Names = ["alice", "bob", "i", "charlie"];

type _1 = Call1<ConcatNamesFn, Names>; // => "Alice, "Bob", Charlie"
type _2 = ConcatNames<Names>; // => "Alice, "Bob", Charlie"
```

Some unfamiliar utility types are used in the example above:

- **`Params`** and its variants (**`Param0`**, **`Param1`**, etc.) are used to extract the **_declared_ parameters** of a **`TypeLambda`**.
- **`RetType`** is used to extract the **_declared_ return type** of a **`TypeLambda`**.

Don’t confuse these with the actual arguments passed to a **`TypeLambda`**, which are accessed using **`Args`** and its variants. You might notice that these type names are similar to **`Parameters`** and **`ReturnType`** in TypeScript — this is intentional to make them easier to remember.

We also use an interesting pattern to define types that “return” a type-level function. For example, **`Filter`** and **`JoinBy`** are just simple type-level functions, but by using generic type parameters, we can “invoke” them with different types to create different type-level functions.

In the following sections, we’ll refer to these simple type-level functions with generic type parameters (like **`Filter`**, **`Map`**, and **`JoinBy`**) as “**type-level function templates**”. We’ll represent their signatures as:

- **`Filter`**: `<T>[predicate: (value: T) => boolean](values: T[]) => T[]`
- **`Map`**: `<T>[f: (value: T) => U](values: T[]) => U[]`
- **`JoinBy`**: `[sep: string](strings: string[]) => string`

Here, the part wrapped with `[...]` represents the generic type parameters, and the part wrapped with `(...)` represents the actual parameters. If you’re looking for a truly **_generic_ type-level function**, check out the [Generic Type-Level Functions](#generic-type-level-functions) section

## Documentation

### Generic type-level functions

While the “**type-level function templates**” technique as described at the end of the [quickstart guide](#use-as-type-level-functions-) is useful in some cases, it has limitations. There’re times when a _truly_ **_generic_ type-level functions** is still unavoidable.

Let’s continue with the employee names example from the quickstart guide. Sometimes, the number of employees might be too large, and we only want to display the first 3 names. In common functional programming libraries, this can be achieved by using a function typically called **`take`**, which accepts a number `n` and a list of values, and returns the first `n` values of the list. We can define a type-level function **`Take`** as follows:

```typescript
interface Take<N extends number> extends TypeLambda<[values: any[]], any[]> {
  return: _Take<Arg0<this>, N>;
}
type _Take<TS extends unknown[], N extends number, Counter extends void[] = []> =
  TS extends [infer Head, ...infer Tail] ?
    Counter["length"] extends N ?
      []
    : [Head, ..._Take<Tail, N, [...Counter, void]>]
  : [];

type TakeSig = Sig<Take<3>>; // => (values: any[]) => any[]
```

Since we haven’t yet introduced the concept of _generic_ type-level functions, we simply declare the signature of **`Take`** as `[n: number](values: any[]) => any[]`. Let’s use it to enhance the **`ConcatNames`** example:

```typescript
interface Append<Suffix extends string> extends TypeLambda<[s: string], string> {
  return: `${Arg0<this>}${Suffix}`;
}

type ConcatNames = Flow<
  Filter<Flow<StringLength, NotExtend<1 | 2>>>,
  Take<3>,
  Map<CapitalizeString>,
  JoinBy<", ">,
  Append<", ...">
>;

type Names = ["alice", "bob", "i", "charlie", "david"];
type _ = Call1<ConcatNames, Names>; // => "Alice, Bob, Charlie, ..."
```

This version works as expected, but we lose some type safety since the return type of **`Take`** is **`any[]`**. If we change `Map<CapitalizeString>` to something like `Map<RepeatString<"foo">>`, TypeScript will not catch the error:

```typescript
interface RepeatString<S extends string> extends TypeLambda<[n: number], string> {
  return: _RepeatString<S, Arg0<this>>;
}
type _RepeatString<S extends string, Times extends number, Counter extends void[] = []> =
  [Times] extends [never] ? never
  : Counter["length"] extends Times ? ""
  : `${S}${_RepeatString<S, Times, [...Counter, void]>}`;

type ConcatNames = Flow<
  Filter<Flow<StringLength, NotExtend<1 | 2>>>,
  Take<3>,
  Map<RepeatString<"foo">>,
  JoinBy<", ">,
  Append<", ...">
>;

// Unexpected result!
type _ = Call1<ConcatNames, Names>; // => "${string}, ..."
```

We can declare **`Take`** as a **_generic_ type-level function** to ensure type safety:

```typescript
import type { Arg0, Sig, TArg, TypeLambdaG } from "hkt-core";

interface Take<N extends number> extends TypeLambdaG<["T"]> {
  signature: (values: TArg<this, "T">[]) => TArg<this, "T">[];
  return: _Take<Arg0<this>, N>;
}

type TakeSig = Sig<Take<3>>; // => <T>(values: T[]) => T[]
```

Here, instead of extending `TypeLambda`, we extend **`TypeLambdaG`**, where the **`G`** suffix stands for “**generic**”. Instead of directly declaring the signature in `TypeLambda`, we declare the **type parameter list** in **`TypeLambdaG`** and use the **`signature`** property inside the function body to define the signature. All declared type parameters can be accessed using the **`TArg<this, "Name">`** syntax within the **`TypeLambdaG`** body.

By defining **`Take`** as a _generic_ type-level function, TypeScript can now catch the error:

```typescript
type ConcatNames = Flow<
  Filter<Flow<StringLength, NotExtend<1 | 2>>>,
  Take<3>,
  Map<RepeatString<"foo">>,
  // ~~~~~~~~~~~~~~~~~~~~~
  // Type 'Map<RepeatString<"foo">>' does not satisfy the constraint 'TypeLambda1<string[], any>'.
  //   Types of property 'signature' are incompatible.
  //     Type '(xs: number[]) => string[]' is not assignable to type '(args_0: string[]) => any'.
  //       Types of parameters 'xs' and 'args_0' are incompatible.
  //         Type 'string[]' is not assignable to type 'number[]'.
  //           Type 'string' is not assignable to type 'number'.
  JoinBy<", ">,
  Append<", ...">
>;
```

How does this work? Similar to generic functions in TypeScript, the **inference mechanism** of **\*generic\* type-level functions** in **hkt-core** also relies on **type parameters**, which works as follows:

1. Try to infer the type parameters from all the parameter types or return types that are already known.
2. If a type parameter cannot be inferred, it defaults to its upper bound (**`unknown`** by default).
3. Replace all occurrences of type parameters in the signature with their actual types.

In the example above, we already know the type of the first parameter of **`Take<3>`** is **`string[]`** (from the previous type-level function `Filter<Flow<StringLength, NotExtend<1 | 2>>>`), so we can infer the type parameter **`T`** in **`Take`** as **`string`**. Then, we replace **`TArg<this, "T">`** with **`string`** in the signature of **`Take`**, inferring the return type as **`string[]`**. This allows TypeScript to catch the error when the next type-level function **`Map`** expects **`number[]`** but receives **`string[]`**.

How can **`Flow`** pass the “known” types to **`Take`** in order to return the correct type? Internally, it involves a utility type called **`TypeArgs`**, which accepts the second argument, **`Known`**, as the known types, and then gives the inferred type parameters:

```typescript
import type { TypeArgs } from "hkt-core";

type InferredTypeArgs1 = TypeArgs<Take<3>, [string[]]>; // => { readonly "~T": string }
type InferredTypeArgs2 = TypeArgs<Take<3>, { 0: number[] }>; // => { readonly "~T": number }
type InferredTypeArgs3 = TypeArgs<Take<3>, { r: boolean[] }>; // => { readonly "~T": boolean }
type InferredTypeArgs3 = TypeArgs<Take<3>, { 0: string[]; r: number[] }>; // => { readonly "~T": string | number }
```

Here, **`Known`** can be an object with integer keys and a special key **`"r"`** (tuples are also supported since they satisfy this condition), where the integer keys represent known parameter types at specific indexes, and **`"r"`** represents the known return type.

Utility types like **`Params`**, **`RetType`**, and their variants also support **`Known`** to provide a more precise result based on the known types:

```typescript
type InferredParams = Params<Take<3>, { r: string[] }>; // => [values: string[]]
type InferredRetType = RetType<Take<3>, { 0: string[] }>; // => string[]
```

The implementation of **`Flow`** relies on the second argument of **`RetType`** to compute a more precise return type of a type-level function based on the return type of the previous one, which is how type safety is achieved.

Now that we’ve explored how the **_generic_ type system** works in **hkt-core**, let’s look at the format of **_generic_ type parameters** in more detail:

```typescript
type GenericTypeParams = Array<SimpleTypeParam | TypeParamWithUpperBound>;
// A simple type parameter with only a name and the upper bound defaults to `unknown`
type SimpleTypeParam = `${Capitalize<string>}`;
// A type parameter with its name (the first element) and an upper bound (the second element)
type TypeParamWithUpperBound = [`${Capitalize<string>}`, unknown];
```

At the end of this section, let’s quickly skim some examples of other _generic_ type-level functions:

```typescript
// A type-level function that simply returns the input (this is already built into hkt-core)
interface Identity extends TypeLambdaG<["T"]> {
  signature: (value: TArg<this, "T">) => TArg<this, "T">;
  return: Arg0<this>;
}

type IdentitySig = Sig<Identity>; // => <T>(value: T) => T

// A generic implementation of `Map`
interface Map extends TypeLambdaG<["T", "U"]> {
  signature: (
    f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
    xs: TArg<this, "T">[],
  ) => TArg<this, "U">[];
  return: _Map<Arg0<this>, Arg1<this>>;
}
type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

type MapSig = Sig<Map>; // => <T, U>(f: (x: T) => U, xs: T[]) => U[]

// A generic `Object.fromEntries` at type level
interface FromEntries extends TypeLambdaG<[["K", PropertyKey], "V"]> {
  signature: (
    entries: [TArg<this, "K">, TArg<this, "V">][],
  ) => Record<TArg<this, "K">, TArg<this, "V">>;
  return: _FromEntries<Arg0<this>>;
}
type _FromEntries<Entries extends [PropertyKey, unknown][]> = _PrettifyObject<{
  [K in Entries[number][0]]: Extract<Entries[number], [K, unknown]>[1];
}>;
type _PrettifyObject<O> = O extends infer U ? { [K in keyof U]: U[K] } : never;

type FromEntriesSig = Sig<FromEntries>; // => <K extends PropertyKey, V>(entries: [K, V][]) => Record<K, V>
type _ = Call1<FromEntries, [["name", string], ["age", number]]>; // => { name: string, age: number }
```

### Aliases for classical HKT use cases

**hkt-core** provide the following aliases for **type constructors**:

- **`HKT`**, **`HKT2`**, **`HKT3`** and **`HKT4`** are aliases for **`TypeLambda1`**, **`TypeLambda2`**, **`TypeLambda3`** and **`TypeLambda4`**, respectively.
- **`Kind`**, **`Kind2`**, **`Kind3`** and **`Kind4`** are aliases for **`Call1W`**, **`Call2W`**, **`Call3W`** and **`Call4W`**, respectively.

The aliases for higher-arity type constructors allow you to work with type constructors that take multiple type arguments, such as **`Either<L, R>`** or **`State<S, A>`**.

The **`W`** suffix in **`Call*W`** stands for “**widening**”, meaning type checking and validation are relaxed for arguments passed to the type-level function. For more details, see the [Bypass strict type checking and validation](#bypass-strict-type-checking-and-validation) sections.

### Type checking and validation in detail

#### Type checking V.S. Type validation

Just like in plain TypeScript, **type checking** and **type validation** are two different concepts that are often confused.

In plain TypeScript, **type checking** refers to the _compile-time_ verification that ensures variables, function parameters, and return values match their _declared_ types. Meanwhile, **(runtime) type validation** is the _run-time_ process that confirms actual values conform to the declared types. **Type checking** is handled by the TypeScript compiler, whereas **type validation** is usually performed by custom code or 3rd-party libraries such as [Zod](https://github.com/colinhacks/zod), [TypeBox](https://github.com/sinclairzx81/typebox) and [Arktype](https://github.com/arktypeio/arktype).

Although **hkt-core** is a _type-only_ library operating solely at _compile-time_, the distinction still applies. In **hkt-core**, **type checking** verifies that the input types provided to a type-level function are compatible with the _declared_ types, e.g., the TypeScript compiler will emit errors for signature mismatches in utilities like `Flow` or `Pipe`.

On the other hand, **type validation** in **hkt-core** ensures that the actual arguments passed or the computed return result match the _declared_ types, typically using utilities like `Args`, `Apply` and `Call*`. For example, if a `Concat` type-level function declared to return a `string` accidentally returns a `number`, the utility will yield **`never`** as the result without triggering a TypeScript error.

#### Bypass strict type checking and validation

There are cases where you might want to bypass strict type checking or validation, such as when working with complex generic types or when you need to handle incompatible types. **hkt-core** provides a set of utilities to help you handle these cases:

- **`ApplyW`**, **`Call1W`**, **`Call2W`**, etc. are the “**widening**” versions of **`Apply`**, **`Call1`**, **`Call2`**, etc. They relax both type _checking_ for arguments passed to the type-level function **and type _validation_ for the return type**.
- **`RawArgs`** and its variants (**`RawArg0`**, **`RawArg1`**, etc.) are used to access the original arguments passed to a **`TypeLambda`**, regardless of whether they are compatible with the parameters.
- **`Params`**, **`RetType`**, **`Args`** and **`RawArgs`** all provide their **widening** versions (e.g., **`RetTypeW`**, **`Args0W`**, **`RawArgs1W`**, etc.) to bypass strict type checking. Unlike **`ApplyW`** and its variants, which relax both type _checking_ for arguments and type _validation_ for return types, these widening utilities are simple aliases for their strict counterparts that relaxes type checking. They return **`never`** when the input type is not a **`TypeLambda`**, and do not perform additional checks or relaxations.

Note that using **`ApplyW`** and its variants alone does not fully bypass strict type checking and validation if the body of a type-level function is still defined using **`Args`** and its variants. **`ApplyW`** and its variants only relax type _checking_ for arguments _passed_ to the type-level function and the return type, but they do not suppress type _validation_ performed by **`Args`** in the type-level function’s body. For example:

```typescript
interface Concat extends TypeLambda<[s1: string, s2: string], string> {
  return: `${Arg0<this>}${Arg1<this>}`;
}

type ConcatWrong = ApplyW<Concat, ["foo", 42]>; // => never
```

Here, `ApplyW<Concat, ["foo", 42]>` still returns **`never`** because `42` is not compatible with `string`. To handle incompatible types, you can use **`RawArgs`** and its variants to access the original arguments:

```typescript
type Stringifiable = string | number | bigint | boolean | null | undefined;

interface Concat extends TypeLambda<[s1: string, s2: string], string> {
  return: RawArg0<this> extends infer S1 extends Stringifiable ?
    RawArg1<this> extends infer S2 extends Stringifiable ?
      `${RawArg0<this>}${RawArg1<this>}`
    : never
  : never;
}

type ConcatWrong = ApplyW<Concat, ["foo", 42]>; // => "foo42"
```

However, you still need to manually check the types of `RawArg0<this>` and `RawArg1<this>` to ensure they are compatible with stringifiable types. Otherwise, TypeScript will issue an error:

```typescript
interface Concat extends TypeLambda<[s1: string, s2: string], string> {
  return: `${RawArg0<this>}${RawArg1<this>}`;
  //         ~~~~~~~~~~~~~   ~~~~~~~~~~~~~
  // Type 'RawArg0<this>' is not assignable to type 'string | number | bigint | boolean | null | undefined'.
  // Type 'RawArg1<this>' is not assignable to type 'string | number | bigint | boolean | null | undefined'.
}
```

While **`ApplyW`** might seem less useful in this example, it can be helpful in specific scenarios, such as when relaxing the return type of a type-level function:

```typescript
interface Concat extends TypeLambda<[s1: string, s2: string], number> {
  // <- Return type is `number`
  return: `${Arg0<this>}${Arg1<this>}`;
}

type _1 = Apply<Concat, ["foo", "bar"]>; // => never, since the declared return type is `number`
type _2 = ApplyW<Concat, ["foo", "bar"]>; // => "foobar", since the return type is relaxed
```

As we can see, bypassing strict type checking doesn’t always simplify things and can introduce additional complexity. These widening utilities are primarily intended for handling complex scenarios, such as when dealing with intricate variance or type constraints, and are not meant for common use cases. For example, they are useful when defining a **`Flip`** type-level function (already built into **hkt-core**) that swaps the order of two types.

In most cases, you don’t need these widening utilities if you skip declaring your type-level function’s signatures (i.e., use _untyped_ type-level functions). The parameters and return type of **`TypeLambda`** already default to **`any`**, so these widening utilities and their strict counterparts behave the same in such cases, as shown in the [Use as classical HKTs](#use-as-classical-hkts-) section.

#### Type validation in `Args`

<strong><code>Args</code></strong> and its variants (**`Arg0`**, **`Arg1`**, etc.) enforce strict type validation inside the **`TypeLambda`** definition. By using them, TypeScript can infer the types of the arguments against the **_declared_ parameters** correctly — meaning you don’t need to manually check the types of the arguments inside the **`TypeLambda`**, they just work!

```typescript
type JoinString<S1 extends string, S2 extends string> = `${S1}${S2}`;
type JoinStringAndNumber<S extends string, N extends number> = `${S}${N}`;

// This is not necessary
interface ConcatRedundant extends TypeLambda<[s1: string, s2: string], string> {
  return: Arg0<this> extends infer S1 extends string ?
    Arg1<this> extends infer S2 extends string ?
      JoinString<S1, S2>
    : never
  : never;
}

// This is enough
interface Concat extends TypeLambda<[s1: string, s2: string], string> {
  return: JoinString<Arg0<this>, Arg1<this>>; // OK
}

// Incompatible type errors are caught by TypeScript
interface ConcatMismatch extends TypeLambda<[s1: string, s2: string], string> {
  // The intermediate error messages might be confusing, just focus on the last one for the actual issue
  return: JoinStringAndNumber<Arg0<this>, Arg1<this>>;
  //                                      ~~~~~~~~~~
  // Type 'Arg1<this>' does not satisfy the constraint 'number'.
  //   Type 'CastArgs<unknown, TolerantParams<this>>[1]' is not assignable to type 'number'.
  //     Type 'TolerantParams<this>[1] | (AlignArgs<{}, TolerantParams<this>, []> extends infer CastedArgs extends ExpectedParams ? CastedArgs : never)[1]' is not assignable to type 'number'.
  //       Type 'TolerantParams<this>[1]' is not assignable to type 'number'.
  //         Type 'string' is not assignable to type 'number'.
}
```

What happens if you force-call a _typed_ type-level function with incompatible types? In such cases, incompatible arguments are replaced with **`never`**:

```typescript
interface Concat extends TypeLambda<[s1: string, s2: string], string> {
  return: [Arg0<this>, Arg1<this>]; // We just print the arguments here for demonstration
}

type ConcatWrong = Call2W<Concat, "foo", 42>; // => ["foo", never]
```

The rules for handling incompatible arguments are as follows:

- If an argument is not compatible with the corresponding parameter, it is cast to **`never`**.
- Redundant arguments are truncated.
- Missing arguments are filled with **`never`**.

Here’s an example to demonstrate these rules:

```typescript
interface PrintArgs extends TypeLambda<[a: string, b: string], string> {
  return: Args<this>;
}

// Incompatible arguments are cast to `never`
type _1 = ApplyW<PrintArgs, ["foo", 42]>; // => ["foo", never]
// Redundant arguments are truncated
type _2 = ApplyW<PrintArgs, ["foo", "bar", "baz"]>; // => ["foo", "bar"]
// Missing arguments are filled with `never`
type _3 = ApplyW<PrintArgs, ["foo"]>; // => ["foo", never]
```

If you want to access the original arguments passed to a **`TypeLambda`**, regardless of whether they are compatible with the parameters, use **`RawArgs`** or its variants instead (see the [Bypass strict type checking and validation](#bypass-strict-type-checking-and-validation) section for more details).

#### Type checking and validation in `Apply` and `Call*`

Just like **`Args`** and its variants, which coerce the arguments to match the declared parameters, **`Apply`** and its variants (**`Call1`**, **`Call2`**, etc.) coerce the returned value of a type-level function to match the declared return type. If the returned value is not compatible with the declared return type, it is cast to **`never`**:

```typescript
interface Concat extends TypeLambda<[s1: string, s2: string], string> {
  return: `${Arg0<this>}${Arg1<this>}`;
}

// Here we return a number, which is incompatible with the declared return type `string`
interface ConcatWrong extends TypeLambda<[s1: string, s2: string], string> {
  return: 42;
}

type _1 = Apply<Concat, ["foo", "bar"]>; // => "foobar"
type _2 = Apply<ConcatWrong, ["foo", "bar"]>; // => never
type _3 = Call2<ConcatWrong, "foo", "bar">; // => never
```

In the example above, **`ConcatWrong`** returns a number, which is incompatible with the declared return type **`string`**. Even though **`ConcatWrong`** returns a value that is not **`never`** (i.e., `42`), **`Apply`** still coerces the returned value to **`never`** because it is not compatible with the declared return type. The same applies to the variants of **`Apply`**, such as **`Call2`** in this case.

As is already mentioned in the [Bypass strict type checking and validation](#bypass-strict-type-checking-and-validation) section, you can use **`ApplyW`** and its variants if you don’t want the return value to be coerced to **`never`** when it’s incompatible with the declared return type.

While the return type coercion behavior of **`Apply`** and its variants might cause confusion in some cases, it is useful for making TypeScript aware of type incompatibilities early on. For example, let’s revisit the **`JoinBy`** function from the **`JoinBy`** function from the [Generic type-level functions](#generic-type-level-functions) section. However, instead of using `Arg0<this> extends [infer S extends string]` in the body, let’s remove the `extends string` constraint and use `Arg0<this> extends [infer S]`:

```typescript
interface JoinBy<Sep extends string> extends TypeLambda<[strings: string[]], string> {
  return: Arg0<this> extends [infer S] ? S
  : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
    `${Head}${Sep}${Call1<JoinBy<Sep>, Tail>}`
  : "";
}
```

In this case, TypeScript cannot ensure that the return type of **`JoinBy`** is always **`string`**, because it cannot infer the type of **`S`** in the first condition, even though we know **`S`** can only be **`string`**. If we replace **`Call1`** with **`Call1W`**, we’ll actually get an error:

```typescript
interface JoinBy<Sep extends string> extends TypeLambda<[strings: string[]], string> {
  return: Arg0<this> extends [infer S] ? S
  : Arg0<this> extends [infer Head extends string, ...infer Tail extends string[]] ?
    `${Head}${Sep}${Call1W<JoinBy<Sep>, Tail>}`
  : //              ~~~~~~~~~~~~~~~~~~~~~~~~~
    // Type '...' is not assignable to type 'string | number | bigint | boolean | null | undefined'.
    //   Type 'unknown' is not assignable to type 'string | number | bigint | boolean | null | undefined'.
    "";
}
```

However, because we use **`Call1`** in the original implementation, TypeScript doesn’t report such an issue in the function. This is because **`Call1`** always coerces the return value to match the declared return type **`string`**, allowing TypeScript to ensure that the type of `Call1<JoinBy<Sep>, Tail>` must be **`string`**, and thus no issue arises.

#### Type checking and validation in _generic_ type-level functions

> [!TIP]
>
> This section assumes you’ve already read the [Generic type-level functions](#generic-type-level-functions) section.

When it comes to **_generic_ type-level functions**, the type checking/validation behavior is slightly different. The general rule is _still the same_ as in previous sections, but here we have to address an issue that can often break type checking in many libraries: **variance**.

Consider the generic **`Map`** example we skimmed at the end of the [Generic type-level functions](#generic-type-level-functions) section:

```typescript
interface Map extends TypeLambdaG<["T", "U"]> {
  signature: (
    f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
    xs: TArg<this, "T">[],
  ) => TArg<this, "U">[];
  return: _Map<Arg0<this>, Arg1<this>>;
}
type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
```

Let’s try to implement a “type-safe” **`MyApply`** based on **`ApplyW`**, which you might initially write like this:

```typescript
type MyApply<F extends TypeLambda, Args extends Params<F>> = ApplyW<F, Args>;
```

This works well for simple non-generic type-level functions, such as **`Concat`**, **`Add`**, or even type-level function templates like **`JoinBy`**. But when we apply it to **`Map`**, an issue arises:

```typescript
type _ = MyApply<Map, [Append<"baz">, ["foo", "bar"]]>;
//                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Type '[Append<"baz">, ["foo", "bar"]]' does not satisfy the constraint '[f: TypeLambda<[x: unknown], unknown>, xs: unknown[]]'.
//   Type at position 0 in source is not compatible with type at position 0 in target.
//     The types of 'signature' are incompatible between these types.
//       Type '(s: string) => string' is not assignable to type '(x: unknown) => unknown'.
//         Types of parameters 's' and 'x' are incompatible.
//           Type 'unknown' is not assignable to type 'string'.
```

This issue arises due to TypeScript's generic instantiation mechanism: when TypeScript cannot infer the type of a type parameter, it defaults to its upper bound (**`unknown`** by default). For those familiar with variance handling in TypeScript, this behavior may seem unintuitive: for covariant type parameters, this is expected, but for contravariant type parameters (like those in function parameters), they should default to **`never`**. This mismatch is why the issue occurs.

Let’s take a look at the result of **`Params<Map>`** to better understand the root cause:

```typescript
type ParamsOfMap = Params<Map>; // => [f: TypeLambda<[x: unknown], unknown>, xs: unknown[]]
```

The signature of **`Append<"baz">`** is `(s: string) => string`, whereas the expected signature is `(x: unknown) => unknown`. Because of the covariant nature of function parameters in TypeScript, **`(s: string) => string`** is not considered a subtype of **`(x: unknown) => unknown`**. This is because **`unknown`** is not assignable to **`string`**, which causes the type checking error.

Similar issues also occur in non-type-level functions in TypeScript. For example:

```typescript
const apply = <F extends (...args: any) => unknown>(f: F, args: Parameters<F>): ReturnType<F> =>
  Function.prototype.apply(f, args);

const map = <T, U>(f: (x: T) => U, xs: T[]): U[] => xs.map(f);

apply(map, [(s: string) => s + "baz", ["foo", "bar"]]);
//          ~~~~~~~~~~~~~~~~~~~~~~~~
//          Type '(s: string) => string' is not assignable to type '(x: unknown) => unknown'.
//            Types of parameters 's' and 'x' are incompatible.
//              Type 'unknown' is not assignable to type 'string'.
```

This explains why the signature of `Function.prototype.apply` in TypeScript is `(thisArg: any, argArray?: any) => any`: TypeScript cannot correctly handle the variance of function parameters, so it uses **`any`** to bypass strict type checking.

However, in **hkt-core**, we need a solution for this problem because the only way to invoke a type-level function is through utilities like **`Apply`** and **`Call*`**. That’s where **`TolerantParams`** and **`TolerantRetType`** come in. They work as follows:

1. Test the variance of each type parameter (using dummy types):
   - If a type parameter is **covariant**, it is replaced with its **upper bound**.
   - If a type parameter is **contravariant**, it is replaced with **`never`**.
   - If a type parameter is **invariant**, it is replaced with **`any`**.
2. Replace the type parameters in the signature with the corresponding types.
3. Extract the parameters or return type from the signature.

By applying these rules, **`TolerantParams`** and **`TolerantRetType`** yield more precise results than **`Params`** and **`RetType`** when used with generic type-level functions:

```typescript
import type { TolerantParams, TolerantRetType } from "hkt-core";

type TolerantParamsOfMap = TolerantParams<Map>; // => [f: TypeLambda<[x: never], unknown>, xs: unknown[]]
type TolerantRetTypeOfMap = TolerantRetType<Map>; // => unknown[]
```

With **`TolerantParams`** replacing **`Params`**, TypeScript no longer throws errors about incompatible types — and that’s how type checking for parameters is handled in **`Apply`** and its variants.

The same principles apply to **`Args`** and its variants. **`TolerantParams`** is used instead of **`Params`** to ensure correct type validation, and we’ll skip the details here since they work in much the same way.

### Common Utilities

There are many utilities commonly used in functional programming libraries. Some are very simple but are used frequently, while others may be used less often but can be quite complex to implement at the type level, especially to work well with _generic_ type-level functions. Some of these utilities are already built into **hkt-core** and can be seamlessly composed with your own type-level functions.

#### `Always`, `Identity` and `Ask`

These utilities are simple but frequently used in functional programming libraries. Let's start with **`Always`**, which creates a type-level function that accepts zero arguments and always returns a constant value (this function is often called **`constant`** in some libraries):

```typescript
interface Always<T> extends TypeLambda<[], T> {
  return: T;
}
```

This utility is useful when a type-level function accepts a transformer function, like **`TypeLambda1`**, to transform the input type, but you don’t actually need to transform the input type and just want to return a constant value:

```typescript
// Suppose we have a Rust-like `Result` type
type Result<T, E> = Ok<T> | Err<E>;
// ... and a utility type-level function `Result.Match` to match the result
namespace Result {
  export interface Match<OnOk extends TypeLambda1, OnErr extends TypeLambda1>
    extends TypeLambda</* ... */> {
    return: /* ... */
  }
}

type _ = Pipe<Ok<"Bob">, Result.Match<Prepend<"Mr. ">, Always<"Oops!">>>; // => "Mr. Bob"
```

Next is **`Identity`**, a **_generic_ type-level function** that accepts a single argument and returns the same value:

```typescript
interface Identity extends TypeLambdaG<["T"]> {
  signature: (value: TArg<this, "T">) => TArg<this, "T">;
  return: Arg0<this>;
}
```

**`Identity`** serves a similar role to **`Always`**, useful when you need to pass a transformer function but don’t want to transform the input type:

```typescript
type MatchResult = Pipe<Err<"Oops!">>, Result.Match<Prepend<"Mr. ">, Identity>>;
```

Another interesting use case of **`Identity`** is converting a **`FlatMap`** operation to **`Flatten`** by passing **`Identity`** as the transformer, and you can find even more use cases in practice

Lastly, we have **`Ask`**, which behaves similarly to **`Identity`**, but instead of being a _generic_ type-level function, it is defined as a **type-level function template**:

```typescript
interface Ask<T> extends TypeLambda<[value: T], T> {
  return: Arg0<this>;
}
```

**`Ask`** might be the most useful utility among these three. It is commonly used with **`Flow`** or **`Compose`** to “pin” the signature of a type-level function to a specific type. For example:

```typescript
import type { Ask, Compose, Flow, Identity } from "hkt-core";

type IdentityStringSig = Sig<Flow<Ask<string>, Identity>>; // => (value: string) => string

// You can also use `Compose`, which is used internally by `Flow`,
// to compose exactly 2 type-level functions from **right to left**
type IdentityNumberSig = Sig<Compose<Identity, Ask<number>>>; // => (value: number) => number
```

When composing multiple type-level functions via **`Flow`**, if the first function is a _generic_ type-level function, you can use **`Ask`** to “pin” the first type-level function to avoid type errors about incompatible types.

#### `Tupled` and `Untupled`

**`Flow`** and **`Pipe`** are incredibly useful for composing multiple type-level functions together, but they only work with functions that accept a single argument. If you have a type-level function that accepts multiple arguments, you can use **`Tupled`** to convert it into a function that accepts a single tuple argument:

```typescript
interface Concat extends TypeLambda<[s1: string, s2: string], string> {
  return: `${Arg0<this>}${Arg1<this>}`;
}
type ConcatSig = Sig<Concat>; // => (s1: string, s2: string) => string
type _1 = Call2<Concat, "foo", "bar">; // => "foobar"

type TupledConcat = Tupled<Concat>;
type TupledConcatSig = Sig<TupledConcat>; // => (args: [s1: string, s2: string]) => string
type _2 = Call1<TupledConcat, ["foo", "bar"]>; // => "foobar"
```

The inverse of **`Tupled`** is **`Untupled`**, which converts a function that accepts a single tuple argument back into a function that accepts multiple arguments:

```typescript
interface First extends TypeLambdaG<["T"]> {
  signature: (pair: [TArg<this, "T">, unknown]) => TArg<this, "T">;
  return: Arg0<this>[0];
}
type FirstSig = Sig<First>; // => <T>(pair: [T, unknown]) => T
type _1 = Call1<First, [42, "foo"]>; // => 42

type UntupledFirst = Untupled<First>;
type UntupledFirstSig = Sig<UntupledFirst>; // => <T>(args_0: T, args_1: unknown) => T
type _2 = Call2<UntupledFirst, 42, "foo">; // => 42
```

#### `Flip`

**`Flip`** is useful when you need to swap the order of the arguments in a **`TypeLambda2`**. It is already built into **hkt-core** and can be used as follows:

```typescript
interface Map extends TypeLambdaG<["T", "U"]> {
  signature: (
    f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">,
    xs: TArg<this, "T">[],
  ) => TArg<this, "U">[];
  return: _Map<Arg0<this>, Arg1<this>>;
}
type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };

type MapSig = Sig<Map>; // => <T, U>(f: (x: T) => U, xs: T[]) => U[]
type _1 = Call2<Map, Append<"baz">, ["foo", "bar"]>; // => ["foobaz", "barbaz"]

type FlippedMap = Flip<Map>;
type FlippedMapSig = Sig<FlippedMap>; // => <U, T>(xs: U[], f: (x: U) => T) => T[]
type _2 = Call2<FlippedMap, ["foo", "bar"], Append<"baz">>; // => ["foobaz", "barbaz"]
```

As you can see, **`Flip`** swaps the order of the arguments in the function. In this example, the **`Map`** function originally expects the function (`f`) to be the first argument, and the array (`xs`) to be the second. After using **`Flip`**, the arguments are reversed so that the array comes first, followed by the function.

**`Flip`** also works with **curried** binary type-level functions (i.e., **`TypeLambda1<TypeLambda1>`**):

```typescript
// See the next section for `Curry`
type CurriedMap = Curry<Map>;
type CurriedMapSig = Sig<CurriedMap>; // => <T, U>(f: (x: T) => U) => (xs: T[]) => U[]
type _1 = Call1<Call1<CurriedMap, Append<"baz">>, ["foo", "bar"]>; // => ["foobaz", "barbaz"]

type FlippedCurriedMap = Flip<CurriedMap>;
type FlippedCurriedMapSig = Sig<FlippedCurriedMap>; // => <T, U>(xs: T[]) => (f: (x: T) => U) => U[]
type _2 = Call1<Call1<FlippedCurriedMap, ["foo", "bar"]>, Append<"baz">>; // => ["foobaz", "barbaz"]
```

#### `Curry`

Currying is a common technique in functional programming that transforms a function accepting multiple arguments into a series of functions that each accept a single argument. While useful, currying doesn't fit well in TypeScript, especially **auto-currying** (see [a discussion about TypeScript support in Ramda’s repository](https://github.com/ramda/ramda/issues/2976#issuecomment-706475091)). It’s also quite challenging to create a type-safe, general-purpose **`curry`** function that works well with generics.

However, it _is_ possible to create type-safe curry functions for a specific number of arguments (e.g., `curry2`, `curry3`, etc.), or use overloads for each number of arguments to create a close-to-general-purpose, type-safe **`curry`** function. **hkt-core** provides a utility called **`Curry`** that supports up to **3** arguments, which can be thought of as a combination of overloads for **`curry2`** and **`curry3`**.

For example, you can curry the previously defined **`Map`** function like this:

```typescript
type CurriedMap = Curry<Map>;
type CurriedMapSig = Sig<CurriedMap>; // => <T, U>(f: (x: T) => U) => (xs: T[]) => U[]
type _ = Call1<Call1<CurriedMap, Append<"baz">>, ["foo", "bar"]>; // => ["foobaz", "barbaz"]
```

You can also create a curried version of **`Reduce`**:

```typescript
interface Reduce extends TypeLambdaG<["T", "U"]> {
  signature: (
    f: TypeLambda<[acc: TArg<this, "U">, x: TArg<this, "T">], TArg<this, "U">>,
    init: TArg<this, "U">,
    xs: TArg<this, "T">[],
  ) => TArg<this, "U">;
  return: _Reduce<Arg0<this>, Arg1<this>, Arg2<this>>;
}
type ReduceSig = Sig<Reduce>; // => <T, U>(f: (acc: U, x: T) => U, init: U, xs: T[]) => U
type _1 = Call3<Reduce, Concat, "", ["foo", "bar", "baz"]>; // => "foobarbaz"

type CurriedReduce = Curry<Reduce>;
type CurriedReduceSig = Sig<CurriedReduce>; // => <T, U>(f: (acc: U, x: T) => U) => (init: U) => (xs: T[]) => U
type _2 = Call1<Call1<Call1<CurriedReduce, Concat>, "">, ["foo", "bar", "baz"]>; // => "foobarbaz"
```

**`Curry`** is also quite useful in combination with **`Flip`**. If you have a binary type-level function like **`Map`**, you can use **`Curry`** and **`Flip`** to create two type-level function templates with different argument orders:

```typescript
// <T, U>[f: (x: T) => U](xs: T[]) => U[]
type MapBy<F extends TypeLambda1> = Call1<Curry<Map>, F>;
type MapBySig = Sig<MapBy<Append<"baz">>>; // => (xs: string[]) => string[]

// <T, U>[xs: T[]](f: (x: T) => U) => U[]
type MapOn<TS extends unknown[]> = Call1<Curry<Flip<Map>>, TS>;
type MapOnSig = Sig<MapOn<string[]>>; // => (f: (x: string) => unknown) => unknown[]
```

It’s worth noting that **`U`** is widened to **`unknown`** in the **`MapOn`** example. This is a limitation of TypeScript’s type inference system, and you’ll encounter the same issue if you define similar non-type-level `flip` and `curry2` functions in TypeScript. We provide this example for demonstration purposes, but in real-world scenarios, manually creating curried versions for the two different argument orders is generally a better choice.

### Tips for creating and managing your type-level functions

**hkt-core** is a _core_ library that provides essential utilities for type-level programming in TypeScript, but it doesn’t come with many built-in type-level functions out of the box. We’ve shown some examples of useful type-level functions in the previous sections, and you might create your own toolkit with a lot of useful type-level functions based on **hkt-core**. Below are some tips for creating and managing your type-level functions effectively.

First, while it might seem appealing, we don’t recommend creating auto-currying type-level functions like those in [HOTScript](https://github.com/gvergnaud/HOTScript). TypeScript cannot reliably identify whether a function is partially applied or not (see [a discussion about TypeScript support in Ramda’s repository](https://github.com/ramda/ramda/issues/2976#issuecomment-706475091)), and this applies to type-level functions as well. Instead, we recommend manually creating curried functions, similar to how [fp-ts](https://github.com/gcanti/fp-ts) handles currying.

Another challenge is how to manage different variants of the same type-level function — such as the simple generic version, the type-level function version, and the type-level function template version. A useful strategy is to apply different suffixes to distinguish between these variants. For example, **`Map`**, **`Map$`**, and **`Map$$`**, where the number of **`$`** indicates the number of arguments the returned type-level function accepts:

```typescript
type ConcatNames<Names extends string[]> = Pipe<
  Names,
  List.Filter$<Flow<Str.Length$, Any.NotExtend$<1 | 2>>>,
  List.Map$<Str.Cap$>,
  List.Join$<", ">
>;

export namespace Any {
  /* NotExtend */
  export type NotExtend<T, U> = [T] extends [U] ? false : true;
  export interface NotExtend$<U> extends TypeLambda<[x: unknown], boolean> {
    return: NotExtend<Arg0<this>, U>;
  }
  export interface NotExtend$$ extends TypeLambda<[x: unknown, y: unknown], boolean> {
    return: NotExtend<Arg0<this>, Arg1<this>>;
  }
}

export namespace List {
  /* Filter */
  export type Filter<F extends TypeLambda1<TS[number], boolean>, TS extends unknown[]> = _Filter<
    F,
    TS
  >;
  type _Filter<F, TS, Acc extends unknown[] = []> =
    TS extends [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        _Filter<F, Tail, [...Acc, Head]>
      : _Filter<F, Tail, Acc>
    : Acc;
  export interface Filter$<F extends TypeLambda1<never, boolean>>
    extends TypeLambda<[xs: Param0<F>[]], Param0<F>[]> {
    return: _Filter<F, Arg0<this>>;
  }
  export interface Filter$$ extends TypeLambdaG<["T"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
      xs: TArg<this, "T">[],
    ) => TArg<this, "T">[];
    return: _Filter<Arg0<this>, Arg1<this>>;
  }

  /* Map */
  export type Map<F extends TypeLambda1<TS[number]>, TS extends unknown[]> = _Map<F, TS>;
  type _Map<F, TS> = { [K in keyof TS]: Call1W<F, TS[K]> };
  export interface Map$<F extends TypeLambda1> extends TypeLambda<[xs: Param0<F>[]], RetType<F>[]> {
    return: _Map<F, Arg0<this>>;
  }
  export interface Map$$ extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
      xs: TArg<this, "T">[],
    ) => TArg<this, "U">[];
    return: _Map<Arg0<this>, Arg1<this>>;
  }

  /* Reduce */
  export type Reduce<
    F extends TypeLambda2<never, TS[number]>,
    Init extends Param0<F>,
    TS extends unknown[],
  > = _Reduce<F, TS, Init>;
  type _Reduce<F, TS, Acc> =
    TS extends [infer Head, ...infer Tail] ? _Reduce<F, Tail, Call2W<F, Acc, Head>> : Acc;
  export interface Reduce$<F extends TypeLambda2, Init extends Param0<F>>
    extends TypeLambda<[xs: Param1<F>[]], Param0<F>> {
    return: _Reduce<F, Arg0<this>, Init>;
  }
  export interface Reduce$$$ extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[acc: TArg<this, "U">, x: TArg<this, "T">], TArg<this, "U">>,
      init: TArg<this, "U">,
      xs: TArg<this, "T">[],
    ) => TArg<this, "U">;
    return: _Reduce<Arg0<this>, Arg2<this>, Arg1<this>>;
  }

  /* Join */
  export type Join<Sep extends string, Strings extends string[]> = _Join<Sep, Strings>;
  type _Join<Sep extends string, Strings extends string[], Acc extends string = ""> =
    Strings extends [infer Head extends string, ...infer Tail extends string[]] ?
      _Join<Sep, Tail, `${Acc}${Acc extends "" ? "" : Sep}${Head}`>
    : Acc;
  export interface Join$<Sep extends string> extends TypeLambda<[ss: string[]], string> {
    return: _Join<Sep, Arg0<this>>;
  }
  export interface Join$$ extends TypeLambda<[sep: string, strings: string[]], string> {
    return: _Join<Arg0<this>, Arg1<this>>;
  }
}

export namespace Str {
  /* Cap */
  export type Cap<S extends string> = Capitalize<S>;
  export interface Cap$ extends TypeLambda<[s: string], string> {
    return: Cap<Arg0<this>>;
  }

  /* Length */
  export type Length<S extends string> = _Length<S>;
  type _Length<S extends string, Acc extends void[] = []> =
    S extends `${string}${infer Tail}` ? _Length<Tail, [...Acc, void]> : Acc["length"];
  export interface Length$ extends TypeLambda<[s: string], number> {
    return: _Length<Arg0<this>>;
  }
}
```

We use namespaces here to avoid polluting the global scope, and apply different suffixes to distinguish different variants of the same type-level function. For instance, `List.Map` is a simple generic type that isn’t a type-level function, `List.Map$` is a type-level function template that accepts a single argument, and `List.Map$$` is a type-level function that accepts two arguments. This naming convention allows you to easily manage various versions of the same type-level function and avoid confusion.

## FAQ

### Should I add it as a dev dependency or a regular dependency?

Even though **hkt-core** is a type-only library, it **should _not_** be added as a dev dependency if you are developing a library or framework that will be used by other projects. Without **hkt-core** as a regular dependency, the type definitions of your library will be incomplete, and users will encounter type errors when they try to use it.

On the other hand, if you’re using **hkt-core** just for your own project and don’t plan to publish it as a library, you can safely add it as a dev dependency.

### _Generic_ type-level functions don’t infer types correctly!

**hkt-core** simulates the TypeScript type system at the type level as closely as possible, but it’s not perfect. If something doesn’t work in TypeScript, it’s likely that it won’t work in **hkt-core** either. When encountering issues with generic type-level functions, first test whether their equivalent runtime version works in TypeScript (you can use **fp-ts** or other libraries for this). If it doesn’t work in TypeScript, it’s also unlikely to work in **hkt-core**.

For example, the following code will trigger an error in TypeScript:

```typescript
interface Head extends TypeLambdaG<["T"]> {
  signature: (tuple: [TArg<this, "T">, ...unknown[]]) => TArg<this, "T">;
  return: Arg0<this>[0];
}

type Composed = Flow<Head, Head, Head>;
//                         ~~~~
// Type 'Head' does not satisfy the constraint 'TypeLambda1<unknown, any>'.
//   Types of property 'signature' are incompatible.
//     Type '(tuple: [unknown, ...unknown[]]) => unknown' is not assignable to type '(args_0: unknown) => any'.
//       Types of parameters 'tuple' and 'args_0' are incompatible.
//         Type 'unknown' is not assignable to type '[unknown, ...unknown[]]'.
```

You might expect the signature of **`Composed`** to be inferred as `<T>(tuple3: [[[T, …unknown[]], …unknown[]], …unknown[]]) => T`, but this is the expected behavior. If you try the equivalent runtime code in **fp-ts**, you’ll see that it still doesn’t work in TypeScript:

```typescript
import { flow } from "fp-ts/function";

const head = <T>(tuple: [T, ...unknown[]]): T => tuple[0];

flow(head, head, head);
//   ~~~~
// Argument of type '<T>(tuple: [T, ...unknown[]]) => T' is not assignable to parameter of type '(tuple: [T, ...unknown[]]) => [unknown, ...unknown[]]'.
//   Type 'T' is not assignable to type '[unknown, ...unknown[]]'.
```

These kinds of “issues” are not considered bugs in **hkt-core**. In such cases, it’s often necessary to rethink your design and simplify the type-level functions to avoid complex type inference issues.

Though many unexpected behaviors are _not_ true issues, as described above, there are also cases where unexpected behavior is due to **limitations** inherent in **hkt-core**, particularly with generic function composition. For example, the following code works in TypeScript because TypeScript provides special support for generic function types:

```typescript
declare function compose2<T, U, V>(g: (y: U) => V, f: (x: T) => U): (x: T) => V;

declare function toString(n: number): string;
declare function makeTuple<T>(x: T): [T];

const testCompose2 = compose2(makeTuple, toString);
//    ^?: (x: number) => [string]
```

However, if you try to define a similar type-level **`Compose2`** in **hkt-core**, it won’t work as expected:

```typescript
interface Compose2 extends TypeLambdaG<["T", "U", "V"]> {
  signature: (
    g: (y: TArg<this, "U">) => TArg<this, "V">,
    f: (x: TArg<this, "T">) => TArg<this, "U">,
  ) => (x: TArg<this, "T">) => TArg<this, "V">;
}

declare function toString(n: number): string;
declare function makeTuple<T>(x: T): [T];

type TestCompose2 = RetType<Compose2, [typeof makeTuple, typeof toString]>; // => (x: number) => [unknown]
```

Here, the return type is inferred as `(x: number) => [unknown]` instead of `(x: number) => [string]`. Since **hkt-core** simulates the TypeScript type system at the type level, it cannot provide the same special support for generic function types that TypeScript does.

While these limitations are not expected to be fixed in the near future, you’re welcome to open an issue to present these cases and discuss potential solutions.

If you believe you’ve encountered a bug — where the equivalent runtime code works in TypeScript but **hkt-core** behaves unexpectedly — please [open an issue on the GitHub repository](https://www.github.com/Snowflyt/hkt-core/issues) with a minimal reproduction case. Some known issues are already listed there, so please check whether your issue has already been reported before submitting a new one.

### Why not just access arguments and type parameters via `this`?

Libraries like [HOTScript](https://github.com/gvergnaud/hotscript) use syntax like **`this["arg0"]`** to access arguments inside a type-level function. While this approach seems simpler and more concise, it introduces unnecessary properties to the type-level function, which can lead to variance issues. Let’s first revisit the variance of function types in TypeScript:

```typescript
type IsSubtype<T, U> = [T] extends [U] ? true : false;

// All types are subtypes of `unknown`
type Test1 = IsSubtype<string, unknown>; // => true
// `never` is the subtype of all types
type Test2 = IsSubtype<never, string>; // => true

// `() => string` is also a subtype of `() => unknown`,
// indicating the return type of a function is covariant
type TestReturn = IsSubtype<() => string, () => unknown>; // => true
// While `(_: string) => void` is not a subtype of `(_: unknown) => void`,
// instead, `(_: unknown) => void` is a subtype of `(_: string) => void`,
// indicating the parameter type of a function is contravariant
type TestParam1 = IsSubtype<(_: string) => void, (_: unknown) => void>; // => false
type TestParam2 = IsSubtype<(_: unknown) => void, (_: string) => void>; // => true

// So we get the following result
type TestFunc = IsSubtype<(_: string) => number, (_: never) => unknown>; // => true
```

**hkt-core** provides a _typed_ version of type-level functions, so we should keep the variance rules of **`TypeLambda`** aligned with TypeScript’s function types. However, if we add extra properties like **`args`** to **`TypeLambda`** for convenience to access arguments, we can break the variance rules:

```typescript
interface TypeLambda<Params extends unknown[], R> {
  signature: (...args: Params) => R;
  args: Params;
}

// Oops! This _should_ be `true` as expected
type TestVariance = IsSubtype<TypeLambda<[string], number>, TypeLambda<[never], unknown>>; // => false
```

If we remove the `args: Params` from the code above, we get the standard **`TypeLambda`** implementation as it is defined in **`hkt-core`**, and the result of **`TestVariance`** will be `true` as expected. However, by adding `args: Params` back, **`Params`** now appears in both a contravariant position (as function parameters in the **`signature`** property) and a covariant position (as the **`args`** property). This makes **`Params`** invariant and breaks the variance rules.

Now, you might wonder, what if we use a contravariant **`args`** property, like `args: (_: Params) => void`? While this would work, it forces the user to access the arguments using the more complex syntax `Parameters<this["args"]>[0]`, which doesn’t provide much benefit over the standard **`Args`** utility in **hkt-core**.

## License

This project is licensed under the Mozilla Public License Version 2.0 (MPL 2.0).
For details, please refer to the `LICENSE` file.

In addition to the open-source license, a commercial license is available for proprietary use.
If you modify this library and do not wish to open-source your modifications, or if you wish to use the modified library as part of a closed-source or proprietary project, you must obtain a commercial license.

For details, see `COMMERCIAL_LICENSE.md`.
