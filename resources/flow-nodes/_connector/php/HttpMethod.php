<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/HttpMethod.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** The methods a connector operation may use. */
enum HttpMethod: string
{
    case Get = 'GET';

    case Post = 'POST';

    case Put = 'PUT';

    case Patch = 'PATCH';

    case Delete = 'DELETE';
}
