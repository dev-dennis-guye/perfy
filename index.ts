type PerfyResult = {
  name: string;
  seconds: number;
  nanoseconds: number;
  // divide by a million to convert nanoseconds to milliseconds
  milliseconds?: number | undefined;
  startTime?: number | null;
  endTime?: number | undefined;
  fullMilliseconds?: number | undefined;
  fullSeconds?: number | undefined;
  summary?: string | undefined;
  time?: number | undefined;
  fullNanoseconds?: number | undefined;
};

class PerfyItem {
  readonly name: string;
  result: Required<PerfyResult> | undefined | null;
  time: {
    start: [number, number] | null;
    end: [number, number] | null;
  };
  utc: {
    start: number | null;
    end: number | null;
  };
  readonly autoDestroy: boolean;
  constructor(name: string, autoDestroy: boolean = true) {
    this.name = name;
    this.autoDestroy = autoDestroy;
    this.time = {
      start: null,
      end: null,
    };
    this.utc = {
      start: null,
      end: null,
    };
  }

  reset() {
    this.time = {
      start: null,
      end: null,
    };
    this.utc = {
      start: null,
      end: null,
    };
    this.result = null;
  }

  start() {
    this.reset();
    this.time.start = process.hrtime();
    this.utc.start = Date.now();
  }

  end() {
    if (!this.time.start) {
      throw new Error('start() should be called first!');
    }
    this.time.end = process.hrtime(this.time.start);
    this.utc.end = Date.now();

    let name = this.name ?? '';
    let seconds = this.time.end[0];
    let nanoseconds = this.time.end[1];
    // divide by a million to convert nanoseconds to milliseconds
    let milliseconds = this.time.end[1] / 1000000;
    let startTime = this.utc.start;
    let endTime = this.utc.end;

    let fullMilliseconds = Number((seconds * 1000 + milliseconds).toFixed(3));
    let time = Number((fullMilliseconds / 1000).toFixed(3));
    let fullSeconds = time;
    let fullNanoseconds = seconds * 1000 * 1000000 + nanoseconds;

    let n = this.name ? this.name + ': ' : '';
    let summary = n + time + ' sec.';
    this.result = {
      name,
      seconds,
      nanoseconds,
      milliseconds,
      startTime,
      endTime,
      fullMilliseconds,
      time,
      fullNanoseconds,
      fullSeconds,
      summary,
    };
    return this.result;
  }
}

enum ErrCodes {
  NAME = 'Performance instance name required!',
  NO_ITEM = 'No performance instance with name: ',
  CALLBACK = 'Callback is not a function!',
}
class Perfy {
  private perfList: Record<string, PerfyItem>;
  private static instance = new Perfy();

  constructor() {
    this.perfList = {};
  }

  start(name: string, autoDestroy: boolean = true): Perfy {
    if (!name) {
      throw new Error(ErrCodes.NAME);
    }
    this.perfList[name] = new PerfyItem(name, autoDestroy);
    this.perfList[name].start();
    return this;
  }

  end(name: string): PerfyResult {
    if (!name) {
      throw new Error(ErrCodes.NAME);
    }
    const p = this.perfList[name];
    if (!p) {
      throw new Error(`${ErrCodes.NO_ITEM}: ${name}`);
    }
    // if already ended and has result, return
    if (p.result) {
      return p.result;
    }
    const result = p.end();
    if (p.autoDestroy) {
      delete this.perfList[name];
    }
    return result;
  }
  result(name: string): PerfyResult | null {
    if (!name) {
      throw new Error(ErrCodes.NAME);
    }
    const p = this.perfList[name];
    if (!p || !p.result) {
      return null;
    }
    return p.result;
  }

  exists(name: string): boolean {
    if (!name) {
      throw new Error(ErrCodes.NAME);
    }
    return !!this.perfList[name];
  }

  names() {
    return Object.keys(this.perfList);
  }

  count(): number {
    return this.names().length;
  }

  destroy(name: string): Perfy {
    if (!name) {
      throw new Error(ErrCodes.NAME);
    }
    if (this.perfList[name]) {
      delete this.perfList[name];
    }
    return this;
  }

  destroyAll(): Perfy {
    this.perfList = {};
    return this;
  }
  exec({ fn, name = '' }: { fn: CallbackFunction; name: string }) {
    let p: PerfyItem;
    if (name) {
      this.perfList[name] = new PerfyItem(name, true);
      p = this.perfList[name];
    } else {
      p = new PerfyItem('');
    }
    const done = () => {
      let result = p.end();
      if (name && p.autoDestroy) {
        delete this.perfList[name];
      }
      return result;
    };
    p.start();
    if (fn.length > 0) {
      fn(done);
      return this;
    }
    fn();
    return done();
  }
}

type CallbackFunction = (callback?: Function) => unknown;

export const perfy = new Perfy();
