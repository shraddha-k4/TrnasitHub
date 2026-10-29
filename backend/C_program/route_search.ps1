param(
    [string]$From = "",
    [string]$To = "",
    [string]$DepartureTime = "",
    [string]$Keyword = "",
    [switch]$JsonOutput
)

$ErrorActionPreference = "Stop"

# ---------- Helper: Convert time to TimeSpan ----------

function Convert-ToTimeOfDay {
    param([AllowNull()][string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    $t = $Text.Trim()
    $t = $t -replace '\.(?=\d)', ':'
    $t = $t -replace '(?i)a\.?\s*m\.?', 'AM'
    $t = $t -replace '(?i)p\.?\s*m\.?', 'PM'
    $t = $t -replace '(?i)(\d)(AM|PM)', '$1 $2'
    $t = ($t -replace '\s+', ' ').Trim()

    $formats = [string[]]@(
        "h:mm tt", "hh:mm tt",
        "h:mm:ss tt", "hh:mm:ss tt",
        "h tt", "hh tt",
        "H:mm", "HH:mm",
        "H:mm:ss", "HH:mm:ss"
    )

    $parsed = [DateTime]::MinValue

    $ok = [DateTime]::TryParseExact(
        $t,
        $formats,
        [Globalization.CultureInfo]::InvariantCulture,
        [Globalization.DateTimeStyles]::None,
        [ref]$parsed
    )

    if ($ok) {
        return $parsed.TimeOfDay
    }

    return $null
}

# ---------- Helper: Find stop index ----------

function Find-StopIndex {
    param(
        [object[]]$Stops,
        [string]$Location
    )

    for ($i = 0; $i -lt $Stops.Count; $i++) {
        $stop = [string]$Stops[$i]

        if (
            -not [string]::IsNullOrWhiteSpace($stop) -and
            $stop.IndexOf(
                $Location,
                [StringComparison]::OrdinalIgnoreCase
            ) -ge 0
        ) {
            return $i
        }
    }

    return -1
}

# ---------- Main ----------

try {
    $jsonPath = Join-Path $PSScriptRoot "routes.json"

    if (-not (Test-Path -LiteralPath $jsonPath)) {
        throw "routes.json not found: $jsonPath"
    }

    $response = Get-Content -LiteralPath $jsonPath -Raw |
                ConvertFrom-Json

    if ($response.success -ne $true) {
        throw "Backend returned success=false."
    }

    if ($null -eq $response.data) {
        throw "Backend response does not contain data."
    }

    $routes = @($response.data)

    # ---------- Input: Frontend parameters or terminal ----------

    if (-not $JsonOutput) {
        Write-Host ""
        Write-Host "===================================="
        Write-Host "     TRANSITHUB ROUTE PLANNER"
        Write-Host "===================================="
        Write-Host "Routes received from API: $($routes.Count)"
        Write-Host ""

        if ([string]::IsNullOrWhiteSpace($From)) {
            $From = Read-Host "Enter starting location (e.g. Pune)"
        }

        if ([string]::IsNullOrWhiteSpace($To)) {
            $To = Read-Host "Enter destination (e.g. Pimpri)"
        }

        if ([string]::IsNullOrWhiteSpace($DepartureTime)) {
            $DepartureTime = Read-Host "Enter departure time (optional, e.g. 3:30 PM or 15:30)"
        }

        if ([string]::IsNullOrWhiteSpace($Keyword)) {
            $Keyword = Read-Host "Enter keyword (optional, e.g. train, bus, metro)"
        }
    }

    $from = $From.Trim()
    $to = $To.Trim()
    $depInput = $DepartureTime.Trim()
    $keyword = $Keyword.Trim()

    if ([string]::IsNullOrWhiteSpace($from)) {
        throw "Starting location cannot be empty."
    }

    if ([string]::IsNullOrWhiteSpace($to)) {
        throw "Destination cannot be empty."
    }

    # ---------- Parse departure time ----------

    $minTime = $null

    if (-not [string]::IsNullOrWhiteSpace($depInput)) {
        $minTime = Convert-ToTimeOfDay $depInput

        if ($null -eq $minTime) {
            throw "Invalid time '$depInput'. Use 3:30 PM or 15:30."
        }
    }

    # ---------- Search routes ----------

    $results = @(
        foreach ($route in $routes) {
            $stops = @($route.stops)

            $startIndex = Find-StopIndex -Stops $stops -Location $from
            $endIndex = Find-StopIndex -Stops $stops -Location $to

            # Fallback to route endpoints.
            if (
                $startIndex -lt 0 -and
                ([string]$route.from).IndexOf(
                    $from, [StringComparison]::OrdinalIgnoreCase
                ) -ge 0
            ) {
                $startIndex = 0
            }

            if (
                $endIndex -lt 0 -and
                ([string]$route.to).IndexOf(
                    $to, [StringComparison]::OrdinalIgnoreCase
                ) -ge 0
            ) {
                $endIndex = [Math]::Max(1, $stops.Count - 1)
            }

            # Require source and destination in forward order.
            if (
                $startIndex -lt 0 -or
                $endIndex -lt 0 -or
                $startIndex -ge $endIndex
            ) {
                continue
            }

            # Departure time filter.
            if ($null -ne $minTime) {
                $routeTime = Convert-ToTimeOfDay (
                    [string]$route.departure_time
                )

                if ($null -eq $routeTime -or $routeTime -lt $minTime) {
                    continue
                }
            }

            # Keyword search.
            if (-not [string]::IsNullOrWhiteSpace($keyword)) {
                $fields = @(
                    $route.mode
                    $route.route_number
                    $route.route_name
                    $route.from
                    $route.to
                    $route.operator
                    $route.departure_time
                    $route.arrival_time
                    $route.duration
                    $route.searchable
                ) + $stops

                $allText = ($fields | ForEach-Object {
                    [string]$_
                }) -join " "

                if (
                    $allText.IndexOf(
                        $keyword,
                        [StringComparison]::OrdinalIgnoreCase
                    ) -lt 0
                ) {
                    continue
                }
            }

            $route
        }
    )

    # ---------- Sort by departure time ----------

    $sorted = @(
        $results | Sort-Object -Property @(
            @{
                Expression = {
                    $t = Convert-ToTimeOfDay ([string]$_.departure_time)

                    if ($null -eq $t) {
                        [TimeSpan]::MaxValue
                    }
                    else {
                        $t
                    }
                }
            },
            @{
                Expression = { [string]$_.route_number }
            }
        )
    )

    # ---------- Prepare structured output ----------

    $output = @(
        foreach ($route in $sorted) {
            [PSCustomObject]@{
                mode           = [string]$route.mode
                route_number   = [string]$route.route_number
                route_name     = [string]$route.route_name
                from           = [string]$route.from
                to             = [string]$route.to
                departure_time = [string]$route.departure_time
                arrival_time   = [string]$route.arrival_time
                duration       = [string]$route.duration
                operator       = [string]$route.operator
                stops          = @($route.stops)
            }
        }
    )

    # ---------- JSON output for Express / React ----------

    if ($JsonOutput) {
        $jsonResult = [PSCustomObject]@{
            success = $true
            from    = $from
            to      = $to
            count   = $output.Count
            data    = @($output)
        }

        ConvertTo-Json -InputObject $jsonResult -Depth 6 -Compress
        exit 0
    }

    # ---------- Terminal output ----------

    Write-Host ""
    Write-Host "===================================="
    Write-Host "       ROUTE SEARCH RESULTS"
    Write-Host "===================================="
    Write-Host "From: $from"
    Write-Host "To: $to"

    if ($null -ne $minTime) {
        Write-Host "Departure time: $depInput onwards"
    }

    if ($keyword) {
        Write-Host "Keyword: $keyword"
    }

    Write-Host "Matching routes: $($sorted.Count)"
    Write-Host ""

    if ($sorted.Count -eq 0) {
        Write-Host "No matching routes found."
        Write-Host "Check locations, stops, time and keyword."
    }
    else {
        $output |
            Select-Object mode, route_number, route_name,
                from, to, departure_time, arrival_time, duration,
                @{Name="Stops"; Expression={
                    (@($_.stops) -join " -> ")
                }} |
            Format-Table -AutoSize -Wrap
    }

    Write-Host ""
    Write-Host "Route search completed."
}
catch {
    if ($JsonOutput) {
        [PSCustomObject]@{
            success = $false
            message = $_.Exception.Message
            data    = @()
            count   = 0
        } | ConvertTo-Json -Depth 5 -Compress
    }
    else {
        Write-Host ""
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    exit 1
}
