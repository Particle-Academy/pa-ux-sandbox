/**
 * ESM polyfill for `use-sync-external-store/shim/with-selector.js`.
 *
 * Why this exists: that package ships CJS-only. Its production build does
 * `require("react")`, which rolldown can't statically convert when the
 * module lands in a lazily-loaded chunk (the component-preview chunk) —
 * it leaves a runtime `require` that throws
 * "Calling require for react in an environment that doesn't expose require".
 *
 * vite.config.js aliases the CJS shim to this file. React 19 ships
 * `useSyncExternalStore` natively, so we only need to re-implement the
 * selector+equality memoization layer on top of it. This is the canonical
 * algorithm from React's own `use-sync-external-store/with-selector`
 * source — kept verbatim so behavior matches what zustand expects.
 *
 * zustand v4 imports the DEFAULT export and destructures
 * `useSyncExternalStoreWithSelector`, so we expose both default + named.
 */
import { useSyncExternalStore, useRef, useEffect, useMemo, useDebugValue } from 'react';

export function useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getServerSnapshot,
    selector,
    isEqual,
) {
    const instRef = useRef(null);
    let inst;
    if (instRef.current === null) {
        inst = { hasValue: false, value: null };
        instRef.current = inst;
    } else {
        inst = instRef.current;
    }

    const [getSelection, getServerSelection] = useMemo(() => {
        let hasMemo = false;
        let memoizedSnapshot;
        let memoizedSelection;

        const memoizedSelector = (nextSnapshot) => {
            if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                const nextSelection = selector(nextSnapshot);
                if (isEqual !== undefined && inst.hasValue) {
                    const currentSelection = inst.value;
                    if (isEqual(currentSelection, nextSelection)) {
                        memoizedSelection = currentSelection;
                        return currentSelection;
                    }
                }
                memoizedSelection = nextSelection;
                return nextSelection;
            }

            const prevSnapshot = memoizedSnapshot;
            const prevSelection = memoizedSelection;

            if (Object.is(prevSnapshot, nextSnapshot)) {
                return prevSelection;
            }

            const nextSelection = selector(nextSnapshot);
            if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
                memoizedSnapshot = nextSnapshot;
                return prevSelection;
            }

            memoizedSnapshot = nextSnapshot;
            memoizedSelection = nextSelection;
            return nextSelection;
        };

        const maybeGetServerSnapshot = getServerSnapshot === undefined ? null : getServerSnapshot;
        const getSnapshotWithSelector = () => memoizedSelector(getSnapshot());
        const getServerSnapshotWithSelector =
            maybeGetServerSnapshot === null
                ? undefined
                : () => memoizedSelector(maybeGetServerSnapshot());

        return [getSnapshotWithSelector, getServerSnapshotWithSelector];
    }, [getSnapshot, getServerSnapshot, selector, isEqual]);

    const value = useSyncExternalStore(subscribe, getSelection, getServerSelection);

    useEffect(() => {
        inst.hasValue = true;
        inst.value = value;
    }, [value]);

    useDebugValue(value);
    return value;
}

export default { useSyncExternalStoreWithSelector };
