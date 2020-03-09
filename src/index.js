import { ApolloLink, Observable } from "apollo-link";

const toRequestKey = operation => {
  return operation.operationName;
};

/**
 * An Apollo link that enqueues mutations so that they cannot fire in parallel.
 *
 * To skip the queue pass `{ context: { skipQueue: true } }` to your mutation.
 */
export default class MutationQueueLink extends ApolloLink {
  /**
   * @param {Boolean} props.debug - set to true to enable logging
   */
  constructor({ debug = true } = {}) {
    super();
    this.opQueue = [];
    this.inProcess = false;
    this.debug = debug;
  }

  log(message, ...rest) {
    if (this.debug) {
      console.log(message, ...rest);
    }
  }

  processOperation(entry) {
    const { operation, forward, observer } = entry;
    this.inProcess = true;
    this.log("[PROCESSING] -", toRequestKey(operation));
    forward(operation).subscribe({
      next: result => {
        this.inProcess = false;
        observer.next(result);
        this.log("[NEXT] -", toRequestKey(operation));
        // If there are more operations, process them.
        if (this.opQueue.length) {
          this.processOperation(this.opQueue.shift());
        }
      },
      error: error => {
        this.inProcess = false;
        observer.error(error);
        this.log("[ERROR] -", toRequestKey(operation), error);
        // If there are more operations, process them.
        if (this.opQueue.length) {
          this.processOperation(this.opQueue.shift());
        }
      },
      complete: observer.complete.bind(observer)
    });
  }

  request(operation, forward) {
    // Enqueue all mutations unless manually skipped.
    if (
      operation.toKey().includes('"operation":"mutation"') &&
      !operation.getContext().skipQueue
    ) {
      return new Observable(observer => {
        const operationEntry = { operation, forward, observer };
        if (!this.inProcess) {
          this.processOperation(operationEntry);
        } else {
          this.log("[ENQUEUE] -", toRequestKey(operation));
          this.opQueue.push(operationEntry);
        }
        return () => this.cancelOperation(operationEntry);
      });
    } else {
      return forward(operation);
    }
  }

  cancelOperation(entry) {
    this.opQueue = this.opQueue.filter(e => e !== entry);
  }

  enqueue(entry) {
    this.opQueue.push(entry);
  }
}
