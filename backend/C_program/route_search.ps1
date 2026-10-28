

$ErrorActionPreference = "Stop"

# ---------- Helper functions ----------

# Converts a time string (AM/PM or 24-hour) to a TimeSpan. Returns $null if it can't be parsed.
function Convert-ToTimeOfDay($text) {
    $t = ([string]$text).Trim()
    if ($t -eq "") { return $null }

    # Normalise things like "9.05 pm", "9:05pm", "9:05 p.m."
    $t = $t -replace '\.(?=\d)', ':'
    $t = $t -replace '(?i)a\.?\s*m\.?', 'AM'
    $t = $t -replace '(?i)p\.?\s*m\.?', 'PM'
    $t = $t -replace '(?i)(\d)(AM|PM)', '$1 $2'
    $t = ($t -replace '\s+', ' ').Trim()

    $formats = [string[]]@(
        "h:mm tt", "hh:mm tt", "h:mm:ss tt", "hh:mm:ss tt",
        "h tt", "hh tt",
        "H:mm", "HH:mm", "H:mm:ss", "HH:mm:ss"
    )

    $parsed = [DateTime]::MinValue
    $ok = [DateTime]::TryParseExact(
        $t,
        $formats,
        [Globalization.CultureInfo]::InvariantCulture,
        [Globalization.DateTimeStyles]::None,
        [ref]$parsed
    )

    if ($ok) { return $parsed.TimeOfDay }
    return $null
}

function Find-StopIndex($stops, $location) {
    for ($i = 0; $i -lt $stops.Count; $i++) {
        if ([string]$stops[$i] -and
            ([string]$stops[$i]).IndexOf(
                $location,
                [StringComparison]::OrdinalIgnoreCase
            ) -ge 0) {
            return $i
        }
    }
    return -1
}

# ---------- Main ----------

try {
    $jsonPath = Join-Path $PSScriptRoot "routes.json"

    if (!(Test-Path $jsonPath)) {
        Write-Host "ERROR: routes.json not found."
        exit 1
    }

    $response = Get-Content -Path $jsonPath -Raw |
                ConvertFrom-Json

    if ($response.success -ne $true) {
        Write-Host "ERROR: Backend returned success=false."
        exit 1
    }

    $routes = @($response.data)

    Write-Host "Routes received from API: $($routes.Count)"
    Write-Host ""

    $from = Read-Host "Enter starting location (e.g. Talegaon)"
    $to = Read-Host "Enter destination (e.g. Pune)"
    $depInput = Read-Host "Enter departure time - show schedules from this time onwards (e.g. 3:30 PM or 15:30; optional)"
    $keyword = Read-Host "Enter keyword (mode, bus, train, stop; optional)"

    # Parse the departure time entered by the user
    $minTime = $null
    if ($depInput.Trim() -ne "") {
        $minTime = Convert-ToTimeOfDay $depInput
        if ($null -eq $minTime) {
            Write-Host "ERROR: Could not understand time '$depInput'. Use format like 3:30 PM or 15:30."
            exit 1
        }
    }

    $results = @(
        foreach ($route in $routes) {
            $stops = @($route.stops)

            # Match source and destination in the correct order.
            if ($from.Trim() -ne "" -and $to.Trim() -ne "") {
                $startIndex = Find-StopIndex $stops $from
                $endIndex = Find-StopIndex $stops $to

                # If stops are missing, fall back to route endpoints.
                if ($startIndex -lt 0 -and
                    ([string]$route.from).IndexOf(
                        $from, [StringComparison]::OrdinalIgnoreCase
                    ) -ge 0) {
                    $startIndex = 0
                }

                if ($endIndex -lt 0 -and
                    ([string]$route.to).IndexOf(
                        $to, [StringComparison]::OrdinalIgnoreCase
                    ) -ge 0) {
                    $endIndex = [Math]::Max(1, $stops.Count - 1)
                }

                if ($startIndex -lt 0 -or
                    $endIndex -lt 0 -or
                    $startIndex -ge $endIndex) {
                    continue
                }
            }

            # Departure time filter: keep only schedules at/after the entered time.
            if ($null -ne $minTime) {
                $routeTime = Convert-ToTimeOfDay $route.departure_time
                if ($null -eq $routeTime -or $routeTime -lt $minTime) {
                    continue
                }
            }

            # Search keyword in route details and stop names.
            if ($keyword.Trim() -ne "") {
                $fields = @(
                    $route.mode,
                    $route.route_number,
                    $route.route_name,
                    $route.from,
                    $route.to,
                    $route.operator,
                    $route.departure_time,
                    $route.arrival_time,
                    $route.searchable
                ) + $stops

                $allText = $fields -join " "

                if ($allText.IndexOf(
                    $keyword,
                    [StringComparison]::OrdinalIgnoreCase
                ) -lt 0) {
                    continue
                }
            }

            $route
        }
    )

    # Sort chronologically by departure time (AM before PM, 12:xx AM first).
    # Unparseable times go to the end. Ties are ordered by route number.
    $sorted = @(
        $results | Sort-Object -Property @(
            @{ Expression = {
                $t = Convert-ToTimeOfDay $_.departure_time
                if ($null -eq $t) { [TimeSpan]::MaxValue } else { $t }
            } },
            @{ Expression = { [string]$_.route_number } }
        )
    )

    Write-Host ""
    Write-Host "===================================="
    Write-Host "       ROUTE SEARCH RESULTS"
    Write-Host "===================================="
    if ($null -ne $minTime) {
        Write-Host "Departing from: $depInput onwards"
    }
    Write-Host "Matching routes: $($sorted.Count)"
    Write-Host ""

    if ($sorted.Count -eq 0) {
        Write-Host "No matching routes found."
        Write-Host "Try another location, time or keyword."
    }
    else {
        $sorted |
            Select-Object mode, route_number, route_name,
                from, to, departure_time, arrival_time, duration,
                @{Name="Stops"; Expression={
                    (@($_.stops) -join " -> ")
                }} |
            Format-Table -AutoSize -Wrap
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    exit 1
}