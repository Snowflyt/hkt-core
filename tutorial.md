# Rivo Tutorial

## Introduction

JavaScript developers have been benefiting from powerful Array methods like `Array#map`, `Array#filter`, and `Array#reduce` for years, but what if you could extend such power to _type-level programming_ in TypeScript?

Well, consider a naive example where you have a list of names and you want to concatenate the names that are longer than 3 characters. You could write a function like this:

```typescript
const capitalize = (s: string) => s[0]!.toUpperCase() + s.slice(1);

const concatNames = (names: string[]) =>
  names
    .filter((name) => name.length >= 3)
    .map(capitalize)
    .join(", ");
```

But what if you have a TypeScript tuple type `Names` instead of an array of strings?

```typescript
type Names = ["alice", "bob", "i", "charlie"];
```

For practiced TypeScript developers, it's not hard to write a similar type-level generic type:

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

type R = ConcatNames<["alice", "s", "bob", "charlie"]>;
//   ^?: "Alice, Bob, Charlie"
```

But such type gymnastics can be hard to read and maintain. Rivo is a TypeScript library that provides a set of composable type-level functions to help you write type-level programs more easily.

```typescript
import type { $, Flow, List, Num, Pipe, Sig, Str, _ } from "rivo";

type R1 = List.Filter<Flow<Str.Length, Num.GTE<3>>, ["alice", "s", "bob", "charlie"]>;
//   ^?: ["alice", "bob", "charlie"]
type R2 = Pipe<R1, List.Map<Str.Capitalize>>; // <- Most type-level functions exported by Rivo are auto-curried
//   ^?: ["Alice", "Bob", "Charlie"]
type R3 = List.Join<", ", R2>;
//   ^?: "Alice, Bob, Charlie"

// Compose them all together!
type ConcatNames = Flow<
  List.Filter<Flow<Str.Length, Num.GTE<3>>>,
  List.Map<Str.Capitalize>,
  List.Join<", ">
>;
// Call a type-level function with `$<...>` (`$` is a shorthand for `Call`)
type R = $<ConcatNames, Names>;

// You can use `Sig` to view the signature of a type-level function (for debugging purpose)
type S = Sig<ConcatNames>;
//   ^?: (ss: List<string>) => string
```

Compared with similar libraries like [HOTScript](https://github.com/gvergnaud/hotscript), Rivo ensures type safety when composing type-level functions. For example, if you try to compose two functions with incompatible input and output types, Rivo will throw a compile-time type error.

```typescript
type F = Flow<
  List.Filter<Flow<Str.Length, Num.GTE<3>>>,
  List.Map<Flow<Str.Append<"foo">, Int.Add<1>>>,
  //                               ~~~~~~~~~~
  //           ... Type 'string' is not assignable to type 'number'
  List.Join<", ">
>;
type R = Pipe<"123", Str.ToChars, List.Map<Num.IsPos>>;
//                                ~~~~~~~~~~~~~~~~~~~
//               ... Type 'string' is not assignable to type 'number'
```

If you take it into further consideration, you may be aware that Rivo should have implemented a “virtual” type system built on top of TypeScript's type system to make such type-safety guarantees. In fact, Rivo even implements a simulated generic type system on type level to support “generic” type-level functions like `List.Map` and `List.Filter`. Even “type-level TypeClasses” like `Show` and `Ord` are implemented on type level to support more advanced type-level programming.

```typescript
import { None, Some } from "rivo";
import { Ord, Show } from "rivo/typeclass";

// Type-level TypeClass `Ord`
// We have implemented `Ord` for `Option<Ord>` and `number`, so we can compare them
type R1 = Ord.Compare<Some<Some<27>>, Some<None>>;
//   ^?: 1
type R2 = Ord.Compare<None, Some<Some<27>>>;
//   ^?: -1
type R3 = Ord.Compare<Some<Some<42>>, Some<Some<27>>>;
//   ^?: 1
type R4 = Ord.Compare<Some<Some<42>>, Some<Some<27>>>;
//   ^?: 0

// Type-level TypeClass `Show`
// We have implemented `Show` for number, string, and tuple, so we can stringify them
type R5 = Show.Show<[1, 2, readonly ["foo" | 7, 42]]>;
//   ^?: "[1, 2, readonly ['foo' | 7, 42]]"
```
