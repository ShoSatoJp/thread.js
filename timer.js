class Timer {
    constructor(msg = '', debug = true) {
        this.start = Date.now();
        this.msg = msg;
        this.debug = debug;
        if (this.debug) console.log(`${'\t'.repeat(Timer.TIMER_COUNT)}START:${this.msg}`);
        Timer.TIMER_COUNT++;
    }
    end() {
        var span = Date.now() - this.start;
        Timer.TIMER_COUNT--;
        if (this.debug) console.log(`${'\t'.repeat(Timer.TIMER_COUNT)}END  :${this.msg} ${span}ms`);
        return span;
    }
    static run(fn, msg = '', n = 1) {
        console.log(`${'\t'.repeat(Timer.TIMER_COUNT)}START: ${n} times ${msg}`);
        var t = new Timer(msg, false);
        for (let i = 0; i < n; i++) {
            fn();
        }
        console.log(`${'\t'.repeat(Timer.TIMER_COUNT-1)}END  : ${n} times ${msg} ${t.end()/n}ms`);
    }
}
Timer.TIMER_COUNT = 0;