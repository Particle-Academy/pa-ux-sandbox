<?php

/*
|--------------------------------------------------------------------------
| fancy-support dogfood binding
|--------------------------------------------------------------------------
|
| The showcase's numbers for the support entitlements. The package
| (fancy-support, P1) will own the mechanism; these are this app's values.
| Spec: .ai/plans/fancy-support.md section 5.2 and 9.4.
|
| Plain values only: this file must survive `php artisan config:cache`.
|
*/

return [

    /*
     * `support-open-tickets` (FMS resource): how many tickets a user may have
     * open at once. Plan section 5.2: base 5, premium 15.
     */
    'open_tickets' => [
        'standard' => (int) env('SUPPORT_OPEN_TICKETS_STANDARD', 5),
        'premium' => (int) env('SUPPORT_OPEN_TICKETS_PREMIUM', 15),
    ],

    /*
     * `support-agent-tokens` (FMS resource): the support agent's token budget,
     * in tokens, not money (plan section 9.4). The plan leaves the number to
     * the owner, so this ships at 0: the agent cannot spend anything until a
     * budget is set. Nothing consumes it before P3.
     */
    'agent_tokens' => [
        'budget' => (int) env('SUPPORT_AGENT_TOKEN_BUDGET', 0),
    ],

];
