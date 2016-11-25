// @flow
type FindMatchesResult = void | {
  matches: Array<string|void>;
  priority: string|void;
};

type PriorityArray = Array<string|void>;

type Handler = (...rest: Array<void>) => FindMatchesResult;

type onChangeCb = (
  matches: Array<string|void>,
  priority: string|void,
  ...rest: Array<void>
) => void;

export type ExtendedMQL = {
  addListener: () => void;
  removeListener: () => void;
  matches: boolean;
  value?: string;
};

export type RespondableInstance = {
  listenerCb?: Handler;
  onChangeCb: onChangeCb;
  queries?: Array<ExtendedMQL>;
};

export type FindMatches = (
  instance: RespondableInstance,
  priority: PriorityArray,
  ...rest: Array<void>
) => FindMatchesResult;

export type CreateQueryChangeHandler = (
  findMatches: FindMatches,
  instance: RespondableInstance,
  priority: PriorityArray,
  ...rest: Array<void>
) => Handler;

export type MapMediaQueryLists = (
  breakpoints: Object,
  queryChangeHandler: Handler,
  matchMedia: (query: string) => ExtendedMQL,
  ...rest: Array<void>
) => Array<ExtendedMQL>;

export type ValidateInput = (
   breakpoints: Object,
   onChangeCb: Function,
   priority: PriorityArray,
   ...rest: Array<void>
 ) => void;

export type Destroy = (instance: RespondableInstance, ...rest: Array<void>) => boolean;

type BoundDestroy = (...rest: Array<void>) => boolean;

export type Respondable = (
  breakpoints: Object,
  onChangeCb: onChangeCb,
  priority?: Array<string|void>,
  ...rest: Array<void>
) => BoundDestroy;
