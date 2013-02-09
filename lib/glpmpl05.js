/* glpmpl05.c */

function mpl_internal_fn_gmtime(mpl){
    /* obtain the current calendar time (UTC) */
    return Math.round(Date.now() / 1000);
}

var mpl_internal_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var mpl_internal_moon = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function mpl_internal_mulstr(v, n){
    var ret = '';
    while (n > 0) {
        ret += v;
        n--;
    }
    return ret;
}

function mpl_internal_error1(mpl, str, s, fmt, f, msg){
    xprintf("Input string passed to str2time:");
    xprintf(str);
    xprintf(mpl_internal_mulstr('^', s + 1));
    xprintf("Format string passed to str2time:\n");
    xprintf(fmt);
    xprintf(mpl_internal_mulstr('^', f + 1));
    mpl_internal_error(mpl, msg);
}

function mpl_internal_fn_str2time(mpl, str, fmt){
    /* convert character string to the calendar time */
    var j, year, month, day, hh, mm, ss, zone;
    var s, f;

    function err1(){mpl_internal_error1(mpl, str, s, fmt, f, "time zone offset value incomplete or invalid")}
    function err2(){mpl_internal_error1(mpl, str, s, fmt, f, "time zone offset value out of range")}
    function test(){
        /* check a matching character in the input string */
        if (str[s] != fmt[f])
            mpl_internal_error1(mpl, str, s, fmt, f, "character mismatch");
        s++;
    }

    year = month = day = hh = mm = ss = -1;
    zone = INT_MAX;
    s = 0;
    for (f = 0; f < fmt.length; f++)
    {  if (fmt[f] == '%')
    {  f++;
        if (fmt[f] == 'b' || fmt[f] == 'h')
        {  /* the abbreviated month name */
            var k;
            var name;
            if (month >= 0)
                mpl_internal_error1(mpl, str, s, fmt, f, "month multiply specified");
            while (str[s] == ' ') s++;
            for (month = 1; month <= 12; month++)
            {  name = mpl_internal_moon[month-1];
                var b = false;
                for (k = 0; k <= 2; k++)
                {  if (s[k].toUpperCase() != name[k].toUpperCase())
                {b = true; break}
                }
                if (b) continue;
                s += 3;
                for (k = 3; name[k] != '\0'; k++)
                {  if (str[s].toUpperCase() != name[k].toUpperCase()) break;
                    s++;
                }
                break;
            }
            if (month > 12)
                mpl_internal_error1(mpl, str, s, fmt, f, "abbreviated month name missing or invalid");
        }
        else if (fmt[f] == 'd')
        {  /* the day of the month as a decimal number (01..31) */
            if (day >= 0)
                mpl_internal_error1(mpl, str, s, fmt, f, "day multiply specified");
            while (str[s] == ' ') s++;
            if (!('0' <= str[s] && str[s] <= '9'))
                mpl_internal_error1(mpl, str, s, fmt, f, "day missing or invalid");
            day = (str[s++]) - '0';
            if ('0' <= str[s] && str[s] <= '9')
                day = 10 * day + ((str[s++]) - '0');
            if (!(1 <= day && day <= 31))
                mpl_internal_error1(mpl, str, s, fmt, f, "day out of range");
        }
        else if (fmt[f] == 'H')
        {  /* the hour as a decimal number, using a 24-hour clock
         (00..23) */
            if (hh >= 0)
                mpl_internal_error1(mpl, str, s, fmt, f, "hour multiply specified")
                ;
            while (str[s] == ' ') s++;
            if (!('0' <= str[s] && str[s] <= '9'))
                mpl_internal_error1(mpl, str, s, fmt, f, "hour missing or invalid")
                ;
            hh = (str[s++]) - '0';
            if ('0' <= str[s] && str[s] <= '9')
                hh = 10 * hh + ((str[s++]) - '0');
            if (!(0 <= hh && hh <= 23))
                mpl_internal_error1(mpl, str, s, fmt, f, "hour out of range");
        }
        else if (fmt[f] == 'm')
        {  /* the month as a decimal number (01..12) */
            if (month >= 0)
                mpl_internal_error1(mpl, str, s, fmt, f, "month multiply specified"
                );
            while (str[s] == ' ') s++;
            if (!('0' <= str[s] && str[s] <= '9'))
                mpl_internal_error1(mpl, str, s, fmt, f, "month missing or invalid"
                );
            month = (str[s++]) - '0';
            if ('0' <= str[s] && str[s] <= '9')
                month = 10 * month + ((str[s++]) - '0');
            if (!(1 <= month && month <= 12))
                mpl_internal_error1(mpl, str, s, fmt, f, "month out of range");
        }
        else if (fmt[f] == 'M')
        {  /* the minute as a decimal number (00..59) */
            if (mm >= 0)
                mpl_internal_error1(mpl, str, s, fmt, f, "minute multiply specified");
            while (str[s] == ' ') s++;
            if (!('0' <= str[s] && str[s] <= '9'))
                mpl_internal_error1(mpl, str, s, fmt, f, "minute missing or invalid");
            mm = (str[s++]) - '0';
            if ('0' <= str[s] && str[s] <= '9')
                mm = 10 * mm + ((str[s++]) - '0');
            if (!(0 <= mm && mm <= 59))
                mpl_internal_error1(mpl, str, s, fmt, f, "minute out of range");
        }
        else if (fmt[f] == 'S')
        {  /* the second as a decimal number (00..60) */
            if (ss >= 0)
                mpl_internal_error1(mpl, str, s, fmt, f, "second multiply specified");
            while (str[s] == ' ') s++;
            if (!('0' <= str[s] && str[s] <= '9'))
                mpl_internal_error1(mpl, str, s, fmt, f, "second missing or invalid");
            ss = (str[s++]) - '0';
            if ('0' <= str[s] && str[s] <= '9')
                ss = 10 * ss + ((str[s++]) - '0');
            if (!(0 <= ss && ss <= 60))
                mpl_internal_error1(mpl, str, s, fmt, f, "second out of range");
        }
        else if (fmt[f] == 'y')
        {  /* the year without a century as a decimal number
         (00..99); the values 00 to 68 mean the years 2000 to
         2068 while the values 69 to 99 mean the years 1969 to
         1999 */
            if (year >= 0)
                mpl_internal_error1(mpl, str, s, fmt, f, "year multiply specified")
                ;
            while (str[s] == ' ') s++;
            if (!('0' <= str[s] && str[s] <= '9'))
                mpl_internal_error1(mpl, str, s, fmt, f, "year missing or invalid")
                ;
            year = (str[s++]) - '0';
            if ('0' <= str[s] && str[s] <= '9')
                year = 10 * year + ((str[s++]) - '0');
            year += (year >= 69 ? 1900 : 2000);
        }
        else if (fmt[f] == 'Y')
        {  /* the year as a decimal number, using the Gregorian
         calendar */
            if (year >= 0)
                mpl_internal_error1(mpl, str, s, fmt, f, "year multiply specified")
                ;
            while (str[s] == ' ') s++;
            if (!('0' <= str[s] && str[s] <= '9'))
                mpl_internal_error1(mpl, str, s, fmt, f, "year missing or invalid")
                ;
            year = 0;
            for (j = 1; j <= 4; j++)
            {  if (!('0' <= str[s] && str[s] <= '9')) break;
                year = 10 * year + ((str[s++]) - '0');
            }
            if (!(1 <= year && year <= 4000))
                mpl_internal_error1(mpl, str, s, fmt, f, "year out of range");
        }
        else if (fmt[f] == 'z')
        {  /* time zone offset in the form zhhmm */
            var z;
            if (zone != INT_MAX)
                mpl_internal_error1(mpl, str, s, fmt, f, "time zone offset multiply specified");
            while (str[s] == ' ') s++;
            if (str[s] == 'Z')
            {   z = hh = mm = 0; s++;

            } else {
                if (str[s] == '+'){
                    z = +1; s++;
                }
                else if (str[s] == '-'){
                    z = -1; s++;
                }
                else
                    mpl_internal_error1(mpl, str, s, fmt, f, "time zone offset sign missing");
                hh = 0;
                for (j = 1; j <= 2; j++)
                {  if (!('0' <= str[s] && str[s] <= '9'))
                    err1();
                    hh = 10 * hh + ((str[s++]) - '0');
                }
                if (hh > 23)
                    err2();
                if (str[s] == ':')
                {  s++;
                    if (!('0' <= str[s] && str[s] <= '9')) err1();
                }
                mm = 0;
                if (('0' <= str[s] && str[s] <= '9')){
                    for (j = 1; j <= 2; j++)
                    {  if (!('0' <= str[s] && str[s] <= '9')) err1();
                        mm = 10 * mm + ((str[s++]) - '0');
                    }
                    if (mm > 59) err2();
                }
            }
            zone = z * (60 * hh + mm);
        }
        else if (fmt[f] == '%')
        {  /* literal % character */
            test();
        }
        else
            mpl_internal_error1(mpl, str, s, fmt, f, "invalid conversion specifier");
    }
    else if (fmt[f] == ' '){

    }
    else
        test()
    }
    if (year < 0) year = 1970;
    if (month < 0) month = 1;
    if (day < 0) day = 1;
    if (hh < 0) hh = 0;
    if (mm < 0) mm = 0;
    if (ss < 0) ss = 0;
    if (zone == INT_MAX) zone = 0;
    j = jday(day, month, year);
    xassert(j >= 0);
    return (((j - jday(1, 1, 1970)) * 24.0 + hh) * 60.0 + mm) * 60.0 + ss - 60.0 * zone;
}

function mpl_internal_error2(mpl, fmt, f, msg)
{
    xprintf("Format string passed to time2str:");
    xprintf(fmt);
    xprintf(mpl_internal_mulstr('^', f));
    mpl_internal_error(mpl, msg);
}

function mpl_internal_weekday(j){
    /* determine weekday number (1 = Mon, ..., 7 = Sun) */
    return (j + jday(1, 1, 1970)) % 7 + 1;
}

function mpl_internal_firstday(year){
    /* determine the first day of the first week for a specified year
     according to ISO 8601 */
    var j;
    /* if 1 January is Monday, Tuesday, Wednesday or Thursday, it is
     in week 01; if 1 January is Friday, Saturday or Sunday, it is
     in week 52 or 53 of the previous year */
    j = jday(1, 1, year) - jday(1, 1, 1970);
    switch (mpl_internal_weekday(j))
    {  case 1: /* 1 Jan is Mon */ j += 0; break;
        case 2: /* 1 Jan is Tue */ j -= 1; break;
        case 3: /* 1 Jan is Wed */ j -= 2; break;
        case 4: /* 1 Jan is Thu */ j -= 3; break;
        case 5: /* 1 Jan is Fri */ j += 3; break;
        case 6: /* 1 Jan is Sat */ j += 2; break;
        case 7: /* 1 Jan is Sun */ j += 1; break;
        default: xassert(j != j);
    }
    /* the first day of the week must be Monday */
    xassert(mpl_internal_weekday(j) == 1);
    return j;
}

function mpl_internal_fn_time2str(mpl, t, fmt){
    /* convert the calendar time to character string */
    var j, year = 0, month = 0, day = 0, hh, mm, ss, len;
    var temp;
    var f;
    var str = '', buf;
    if (!(-62135596800.0 <= t && t <= 64092211199.0))
        mpl_internal_error(mpl, "time2str(" + t + ",...); argument out of range");
    t = Math.floor(t + 0.5);
    temp = Math.abs(t) / 86400.0;
    j = Math.floor(temp);
    if (t < 0.0)
    {  if (temp == Math.floor(temp))
        j = - j;
    else
        j = - (j + 1);
    }
    xassert(jdate(j + jday(1, 1, 1970), function(d,m,y){day=d;month=m;year=y}) == 0);
    ss = (t - 86400.0 * j)|0;
    xassert(0 <= ss && ss < 86400);
    mm = ss / 60; ss %= 60;
    hh = mm / 60; mm %= 60;
    len = 0;
    for (f = 0; f < fmt.length; f++)
    {  if (fmt[f] == '%')
    {  f++;
        if (fmt[f] == 'a')
        {  /* the abbreviated weekday name */
            buf = mpl_internal_week[mpl_internal_weekday(j)-1].slice(0,3);
        }
        else if (fmt[f] == 'A')
        {  /* the full weekday name */
            buf = mpl_internal_week[mpl_internal_weekday(j)-1];
        }
        else if (fmt[f] == 'b' || fmt[f] == 'h')
        {  /* the abbreviated month name */
            buf = mpl_internal_moon[month-1].slice(0, 3);
        }
        else if (fmt[f] == 'B')
        {  /* the full month name */
            buf = mpl_internal_moon[month-1];
        }
        else if (fmt[f] == 'C')
        {  /* the century of the year */
            buf = String(Math.floor(year / 100));
        }
        else if (fmt[f] == 'd')
        {  /* the day of the month as a decimal number (01..31) */
            buf = String(day);
        }
        else if (fmt[f] == 'D')
        {  /* the date using the format %m/%d/%y */
            buf = month + "/" + day + "/" + (year % 100);
        }
        else if (fmt[f] == 'e')
        {  /* the day of the month like with %d, but padded with
         blank (1..31) */
            buf = String(day);
        }
        else if (fmt[f] == 'F')
        {  /* the date using the format %Y-%m-%d */
            sprintf(buf, year + "-" + month + "-" + day);
        }
        else if (fmt[f] == 'g')
        {  /* the year corresponding to the ISO week number, but
         without the century (range 00 through 99); this has
         the same format and value as %y, except that if the
         ISO week number (see %V) belongs to the previous or
         next year, that year is used instead */
            var iso;
            if (j < mpl_internal_firstday(year))
                iso = year - 1;
            else if (j < mpl_internal_firstday(year + 1))
                iso = year;
            else
                iso = year + 1;
            buf = String(iso % 100);
        }
        else if (fmt[f] == 'G')
        {  /* the year corresponding to the ISO week number; this
         has the same format and value as %Y, excepth that if
         the ISO week number (see %V) belongs to the previous
         or next year, that year is used instead */
            var iso;
            if (j < mpl_internal_firstday(year))
                iso = year - 1;
            else if (j < mpl_internal_firstday(year + 1))
                iso = year;
            else
                iso = year + 1;
            buf = String(iso);
        }
        else if (fmt[f] == 'H')
        {  /* the hour as a decimal number, using a 24-hour clock
         (00..23) */
            buf = String(hh);
        }
        else if (fmt[f] == 'I')
        {  /* the hour as a decimal number, using a 12-hour clock
         (01..12) */
            buf = String(hh == 0 ? 12 : hh <= 12 ? hh : hh - 12);
        }
        else if (fmt[f] == 'j')
        {  /* the day of the year as a decimal number (001..366) */
            buf  = String(jday(day, month, year) - jday(1, 1, year) + 1);
        }
        else if (fmt[f] == 'k')
        {  /* the hour as a decimal number, using a 24-hour clock
         like %H, but padded with blank (0..23) */
            buf = String(hh);
        }
        else if (fmt[f] == 'l')
        {  /* the hour as a decimal number, using a 12-hour clock
         like %I, but padded with blank (1..12) */
            buf = String(hh == 0 ? 12 : hh <= 12 ? hh : hh - 12);
        }
        else if (fmt[f] == 'm')
        {  /* the month as a decimal number (01..12) */
            buf = String(month);
        }
        else if (fmt[f] == 'M')
        {  /* the minute as a decimal number (00..59) */
            buf = String(mm);
        }
        else if (fmt[f] == 'p')
        {  /* either AM or PM, according to the given time value;
         noon is treated as PM and midnight as AM */
            buf = (hh <= 11 ? "AM" : "PM");
        }
        else if (fmt[f] == 'P')
        {  /* either am or pm, according to the given time value;
         noon is treated as pm and midnight as am */
            buf = (hh <= 11 ? "am" : "pm");
        }
        else if (fmt[f] == 'r')
        {  /* the calendar time using the format %I:%M:%S %p */
            buf = (hh == 0 ? 12 : hh <= 12 ? hh : hh - 12) + ":" + mm + ":" + ss + " " + (hh <= 11 ? "AM" : "PM");
        }
        else if (fmt[f] == 'R')
        {  /* the hour and minute using the format %H:%M */
            buf = hh + ":" + mm;
        }
        else if (fmt[f] == 'S')
        {  /* the second as a decimal number (00..59) */
            buf = String(ss);
        }
        else if (fmt[f] == 'T')
        {  /* the time of day using the format %H:%M:%S */
            buf = hh + ":" + mm + ":" + ss;
        }
        else if (fmt[f] == 'u')
        {  /* the day of the week as a decimal number (1..7),
         Monday being 1 */
            buf = String(mpl_internal_weekday(j));
        }
        else if (fmt[f] == 'U')
        {  /* the week number of the current year as a decimal
         number (range 00 through 53), starting with the first
         Sunday as the first day of the first week; days
         preceding the first Sunday in the year are considered
         to be in week 00 */
            /* sun = the first Sunday of the year */
            var sun = jday(1, 1, year) - jday(1, 1, 1970);
            sun += (7 - mpl_internal_weekday(sun));
            buf = String((j + 7 - sun) / 7);
        }
        else if (fmt[f] == 'V')
        {  /* the ISO week number as a decimal number (range 01
         through 53); ISO weeks start with Monday and end with
         Sunday; week 01 of a year is the first week which has
         the majority of its days in that year; week 01 of
         a year can contain days from the previous year; the
         week before week 01 of a year is the last week (52 or
         53) of the previous year even if it contains days
         from the new year */
            var iso;
            if (j < mpl_internal_firstday(year))
                iso = j - mpl_internal_firstday(year - 1);
            else if (j < mpl_internal_firstday(year + 1))
                iso = j - mpl_internal_firstday(year);
            else
                iso = j - mpl_internal_firstday(year + 1);
            buf = String(iso / 7 + 1);
        }
        else if (fmt[f] == 'w')
        {  /* the day of the week as a decimal number (0..6),
         Sunday being 0 */
            buf = String(mpl_internal_weekday(j) % 7);
        }
        else if (fmt[f] == 'W')
        {  /* the week number of the current year as a decimal
         number (range 00 through 53), starting with the first
         Monday as the first day of the first week; days
         preceding the first Monday in the year are considered
         to be in week 00 */
            /* mon = the first Monday of the year */
            var mon = jday(1, 1, year) - jday(1, 1, 1970);
            mon += (8 - mpl_internal_weekday(mon)) % 7;
            buf = String((j + 7 - mon) / 7);
        }
        else if (fmt[f] == 'y')
        {  /* the year without a century as a decimal number
         (00..99) */
            buf = String(year % 100);
        }
        else if (fmt[f] == 'Y')
        {  /* the year as a decimal number, using the Gregorian
         calendar */
            buf = String(year);
        }
        else if (fmt[f] == '%')
        {  /* a literal % character */
            buf = '%';
        }
        else
            mpl_internal_error2(mpl, fmt, f, "invalid conversion specifier");
    }
    else{
        buf = fmt[f];
        //buf[1] = '\0';
    }
/*
        if (len + buf.length > MAX_LENGTH)
            mpl_internal_error(mpl, "time2str; output string length exceeds " + MAX_LENGTH + " charaters");
*/
        str += buf;
        len += buf.length;
    }
    return str;
}

