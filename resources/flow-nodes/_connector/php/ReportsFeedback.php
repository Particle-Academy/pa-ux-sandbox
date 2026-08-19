<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ReportsFeedback.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A connector that can report responses to things we did.
 *
 * Optional, and ABSENT IS A REAL ANSWER rather than a gap to be filled. A
 * connector with no feedback mechanism must not pretend by returning an empty
 * array — "nobody replied" and "this cannot tell you" are different, and only
 * one of them is news.
 */
interface ReportsFeedback
{
    /**
     * @param  list<string>  $refs  things we did, that the host already holds
     * @param  array<string,string>  $credentials
     * @return list<array{id:string,inReplyTo:string,author:string,text:string,at:string,url:?string,context:array<string,string>}>
     *                                                                                                                              `context` is whatever answering this would need. Opaque to the host.
     */
    public function fetchFeedback(array $refs, array $credentials): array;
}
