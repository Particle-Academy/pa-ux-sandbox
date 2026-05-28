<?php

namespace App\Exceptions;

use RuntimeException;

class InsufficientFundsException extends RuntimeException
{
    public static function for(int $balance, int $requested): self
    {
        return new self("Wallet balance {$balance} is below requested debit of {$requested}.");
    }
}
