<?php

namespace App\Livewire;

use Livewire\Component;

class TimelineExamples extends Component
{
    public array $companyTimeline = [
        [
            'date' => 'January 2020',
            'title' => 'Company Founded',
            'description' => 'Started with a small team of three in a garage.',
            'emoji' => '🚀',
            'color' => 'blue',
        ],
        [
            'date' => 'June 2020',
            'title' => 'First Product Launch',
            'description' => 'Released our MVP to early adopters.',
            'icon' => 'rocket-launch',
            'color' => 'green',
        ],
        [
            'date' => 'March 2021',
            'title' => 'Seed Round',
            'description' => 'Raised $2M from angel investors.',
            'color' => 'amber',
        ],
        [
            'date' => 'November 2021',
            'title' => 'Team Growth',
            'description' => 'Expanded to 25 team members across 3 countries.',
            'icon' => 'user-group',
            'color' => 'purple',
        ],
        [
            'date' => 'July 2022',
            'title' => 'Series A',
            'description' => 'Raised $15M led by top-tier VC.',
            'emoji' => '💰',
            'color' => 'emerald',
        ],
        [
            'date' => 'January 2023',
            'title' => 'Platform v2.0',
            'description' => 'Complete platform rebuild with 10x performance improvements.',
            'icon' => 'bolt',
            'color' => 'sky',
        ],
        [
            'date' => '2024',
            'title' => 'Going Global',
            'description' => 'Expanded to 50+ countries with localized support.',
            'emoji' => '🌍',
            'color' => 'indigo',
        ],
    ];

    public array $roadmap = [
        [
            'date' => 'Q1 2025',
            'title' => 'API v3',
            'description' => 'New REST + GraphQL API with improved rate limiting.',
            'color' => 'blue',
        ],
        [
            'date' => 'Q2 2025',
            'title' => 'Mobile App',
            'description' => 'Native iOS and Android applications.',
            'color' => 'violet',
        ],
        [
            'date' => 'Q3 2025',
            'title' => 'Enterprise Features',
            'description' => 'SSO, audit logs, and advanced permissions.',
            'color' => 'amber',
        ],
        [
            'date' => 'Q4 2025',
            'title' => 'AI Integration',
            'description' => 'Smart automation and predictive analytics.',
            'color' => 'rose',
        ],
    ];

    public array $simpleEvents = [
        ['date' => '2020', 'title' => 'Founded'],
        ['date' => '2021', 'title' => 'First Customer'],
        ['date' => '2022', 'title' => 'Profitability'],
        ['date' => '2023', 'title' => 'Series A'],
        ['date' => '2024', 'title' => '100K Users'],
    ];

    public function render()
    {
        return view('livewire.timeline-examples');
    }
}
