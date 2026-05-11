<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dreaming — {{ config('app.name', 'Fancy UI') }}</title>

    @viteReactRefresh
    @vite(['resources/css/react-demos.css', 'resources/js/dreaming.tsx'])
</head>
<body>
    <div id="dreaming"></div>
</body>
</html>
