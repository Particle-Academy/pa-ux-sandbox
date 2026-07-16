<?php

return [
    /*
    | Keep relay queues away from the application's database cache. Long-poll
    | subscribers update these keys concurrently; SQLite cannot safely serve
    | that workload under Herd. Production may set this to a shared Redis store.
    */
    'cache_store' => env('AGENT_RELAY_CACHE_STORE', env('APP_ENV') === 'testing' ? 'array' : 'file'),
];
