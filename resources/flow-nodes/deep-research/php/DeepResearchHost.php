<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\DeepResearch;

interface DeepResearchHost
{
    /**
     * @param  array{query:string,instructions?:string|null,context?:mixed,depth?:string,maxSources?:int,provider?:string|null,model?:string|null,credential?:string|null}  $request
     * @return array{answer:string,citations:list<array{url:string,title?:string,excerpt?:string,publishedAt?:string}>,provider?:string,model?:string,usage?:array<string,int|float>,metadata?:array<string,mixed>}
     */
    public function research(array $request): array;
}
