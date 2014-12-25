qplot
=====

Make scatterplots quickly comparing the performance of two financial securities

Purpose
-------

Tons of data is available for free on the internet these days, but expensive tools are needed to do common types of analysis efficiently (Bloomberg).  Qplot is intended to make some of this functionality available for free.  It is made by the developer for personal use and will be added to as features are needed.

Todo
----

- Clean up the code.  It is a mess.
- Handle errors gracefully, keep track of timeouts.  Sometimes data soruces don't work as expected.
- Add an indicator of data fetch progress.  Usually data fetch happens extremily quickly, but when it gets stuck it would be nice to get some indication of why.
