<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>React Demos - {{ config('app.name', 'Laravel') }}</title>

    @vite(['resources/css/react-demos.css', 'resources/js/react-demos.tsx'])
</head>
<body>
    <div id="react-demos"></div>
</body>
</html>
