# DeeDee Project

DeeDee is a simple set of scripts, instructions and configuration files which is aimed to help you to
configure your own Debian machine. It was born, when [it's author](http://www.rzegocki.pl/) had enough
of being spied by [his e-mail provider](http://www.gmail.com/), [his personal data keeper](http://www.facebook.com/)
and [provider of his other services](http://www.rackspace.com/). So he bought an ATOM machine and
[it has begun](http://www.youtube.com/watch?v=LrQ2pKMwQC4).

But please, keep in mind, that this project is for (at-least) semi-advanced Linux Administrators, who knows what
they're doing, but just want to have all this stuff in one place. Some of the files have to be edited anyway
(with your domain, IP address or some other parameters) and it's almost sure, that something will break up in the
progress. Oh! And don't forget to restart connected services after each section.

# Basic installation and settings

On other Linux machine, download [Debian netinst](http://www.debian.org/distrib/netinst) and put it on USB

    # As Root
    cat debian-netinst.iso > /dev/sdb # /dev/sdb is your USB device

Next install Debian. If you plan, to treat this document as a step by step guide, install it on LVM volume with all
directories separated (`/home`, `/var`, etc.) and without any extra packages. After installation make some final
adjustments, create a normal "godlike" user (who will have sudo access and so on), install necessary packages and
(optionally) [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh/).

    # As Root
    # Disable installation of recommended packages - for example, most of the time,
    # we don't want 3/4 of Xserver while installing vim
    echo 'APT::Install-Recommends "0";' > /etc/apt/apt.conf.d/00norecommends

    apt-get update
    apt-get install mc openssh-client openssh-server wakeonlan curl build-essential zsh git subversion vim less psmisc \
    unzip unrar ntp ntfs-3g screen ftp rsync

    # As User (Optional)
    curl -L https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh | sh
    chsh -s /bin/zsh
    echo "export EDITOR=/usr/bin/vim" >> ~/.zshrc # or any other prefered

* [/etc/motd](https://github.com/ajgon/DeeDee/blob/master/etc/motd)
* [/home/user/.mc/ini](https://github.com/ajgon/DeeDee/blob/master/home/user/.mc/ini)
* [/root/.mc/ini](https://github.com/ajgon/DeeDee/blob/master/root/.mc/ini)
* [/home/user/.zshrc](https://github.com/ajgon/DeeDee/blob/master/home/user/.zshrc) Optional

# Ruby with passenger and RVM

    # As Root
    apt-get install zlib1g zlib1g-dev libssl-dev libcurl4-openssl-dev libpcre3-dev checkinstall libmysqlclient-dev
    mkdir /home/rails
    chown www-data:www-data /home/rails
    chmod 2770 /home/rails

    # As User
    curl -L https://get.rvm.io | bash -s stable
    rvm install 1.9.3 --with-openssl-dir=/usr
    rvm use 1.9.3
    rvm gemset create passenger
    rvm use 1.9.3@passenger
    gem install passenger

# PHP via FastCGI Process Manager

    # As Root
    echo "deb http://packages.dotdeb.org stable all" >> /etc/apt/sources.list
    wget http://www.dotdeb.org/dotdeb.gpg
    cat dotdeb.gpg | apt-key add -
    rm dotdeb.gpg
    apt-get install php5-fpm php5-suhosin php5-mysql php5-mcrypt php5-intl # add another extensions if necessary

* [/etc/php5/fpm/pool.d/www.conf](https://github.com/ajgon/DeeDee/blob/master/etc/php5/fpm/pool.d/www.conf)
* [/etc/php5/fpm/php.ini](https://github.com/ajgon/DeeDee/blob/master/etc/php5/fpm/php.ini)

# MySQL

    # As Root
    apt-get install mysql-server-5.1
    mysql -u root -p

    -- In MySQL
    -- add all interfaces you plan to use, do not rely on '%'!
    GRANT CREATE, DROP, LOCK TABLES, REFERENCES, EVENT, ALTER, DELETE, INDEX, INSERT, SELECT, UPDATE,
    CREATE TEMPORARY TABLES, TRIGGER, CREATE VIEW, SHOW VIEW ON *.* TO 'local'@'localhost'
    IDENTIFIED BY '<password>';
    GRANT CREATE, DROP, LOCK TABLES, REFERENCES, EVENT, ALTER, DELETE, INDEX, INSERT, SELECT, UPDATE,
    CREATE TEMPORARY TABLES, TRIGGER, CREATE VIEW, SHOW VIEW ON *.* TO 'local'@'127.0.0.1'
    IDENTIFIED BY '<password>';
    FLUSH PRIVILEGES;

# nginx built from scratch

    # As Root
    mkdir /home/packages
    chmod 700 /home/packages
    cd /tmp
    wget http://nginx.org/download/nginx-1.2.2.tar.gz # latest stable
    tar -xzvf nginx-1.2.2.tar.gz
    cd nginx-1.2.2

    # skip last parameter if you don't plan to use Passenger or Ruby at all
    ./configure --prefix=/usr --conf-path=/etc/nginx/nginx.conf --pid-path=/var/run/nginx.pid \
    --lock-path=/var/lock/nginx.lock --http-client-body-temp-path=/var/spool/nginx/client_body_temp \
    --http-proxy-temp-path=/var/spool/nginx/proxy_temp --http-fastcgi-temp-path=/var/spool/nginx/fastcgi_temp \
    --http-log-path=/var/log/nginx/access.log --error-log-path=/var/log/nginx/error.log --user=www-data \
    --group=www-data --with-http_ssl_module --with-ipv6 --with-http_gzip_static_module --with-ipv6 --with-pcre \
    --with-http_realip_module --add-module="/home/user/.rvm/gems/ruby-1.9.3-p0@passenger/gems/passenger-3.0.11/ext/nginx"
    make
    checkinstall -D make install
    mkdir /etc/nginx /var/log/nginx /var/spool/nginx
    chown -R www-data:www-data /var/log/nginx /var/spool/nginx
    mv /tmp/nginx-1.2.2/nginx_1.2.2-1_amd64.deb /home/packages
    mkdir /home/htdocs
    chown www-data:www-data /home/htdocs
    chmod 2755 /home/htdocs

* [/etc/nginx/*](https://github.com/ajgon/DeeDee/blob/master/etc/nginx/)
* [/etc/init.d/nginx](https://github.com/ajgon/DeeDee/blob/master/etc/init.d/nginx)
* [/home/htdocs/*](https://github.com/ajgon/DeeDee/blob/master/home/htdocs/)

Then:

    # As Root
    chmod 755 /etc/init.d/nginx
    /etc/init.d/nginx start
    update-rc.d -f nginx defaults
    chown -R www-data:www-data /home/htdocs

# OpenVPN

    # As Root
    apt-get install openvpn
    cd /etc/openvpn
    cp -r /usr/share/doc/openvpn/examples/easy-rsa .
    cd easy-rsa/2.0
    vim vars # change KEY_SIZE=2048
    . ./vars
    ./clean-all
    ./build-ca
    ./build-key-server server
    ./build-dh
    ./build-key <client-name> # all clients
    cp keys/ca.crt keys/server.crt keys/server.key keys/ca.key keys/dh2048.pem ../../

* [/etc/openvpn/server.conf](https://github.com/ajgon/DeeDee/blob/master/etc/openvpn/server.conf) Needs Edit
* [/etc/sysctl.conf](https://github.com/ajgon/DeeDee/blob/master/etc/sysctl.conf)

Then:

    # As Root
    sysctl -p /etc/sysctl.conf
    iptables -t nat -A POSTROUTING -j MASQUERADE

# Mail with Dovecot/Postfix/Sieve/SpamAssassin/RoundCube

## Dovecot

    # As Root
    apt-get install dovecot-common dovecot-imapd postfix

* [/etc/dovecot/dovecot.conf](https://github.com/ajgon/DeeDee/blob/master/etc/dovecot/dovecot.conf) Needs Edit
* [/etc/dovecot/keys/*](https://github.com/ajgon/DeeDee/blob/master/etc/dovecot/keys/)

Then:

    # As Root
    chmod -R 640 /etc/dovecot/keys/
    groupadd vmail
    useradd -g vmail -s /bin/false vmail
    touch /var/log/dovecot.log /var/log/dovecot-info.log
    chown vmail:vmail /var/log/dovecot*log
    chmod 600 /var/log/dovecot*log
    chmod 700 /home/vmail
    echo "user@example.com:`dovecotpw`" >> /etc/dovecot/passwd

## Postfix

    # As Root
    apt-get install postfix
    chmod -R 640 /etc/postfix/keys/
    chown -R :postfix /etc/postfix/keys

    /etc/postfix/main.cf Needs Edit
    /etc/postfix/master.cf

## Sieve

    # As Root
    wget http://www.rename-it.nl/dovecot/1.2/dovecot-1.2-sieve-0.1.19.tar.gz
    tar xzvf dovecot-1.2-sieve-0.1.19.tar.gz
    cd dovecot-1.2-sieve-0.1.19
    ./configure --with-dovecot=/usr/lib/dovecot/ --prefix=/usr
    make
    make install

* [/home/user/.dovecot.sieve](https://github.com/ajgon/DeeDee/blob/master/home/user/.dovecot.sieve) Needs Edit
* [/home/vmail/user@example.com/.dovecot.sieve](https://github.com/ajgon/DeeDee/blob/master/home/vmail/user@example.com/.dovecot.sieve)

## SpamAssassin

    # As Root
    apt-get install spamc spamassassin pyzor razor
    groupadd dcc
    useradd -g dcc -s /bin/false -d /var/dcc dcc
    wget http://www.dcc-servers.net/dcc/source/dcc-dccproc.tar.Z
    tar xzvf dcc-dccproc.tar.Z
    cd dcc-dccproc-1.3.142
    ./configure --with-uid=dcc
    make
    make install
    chown -R dcc:dcc /var/dcc
    ln -s /var/dcc/libexec/dccifd /usr/local/bin/dccif
    groupdd spamd
    useradd -g spamd -s /bin/false -d /var/lib/spamassassin spamd
    mkdir -p /var/lib/spamassassin
    chown spamd:spamd /var/lib/spamassassin -R

* [/etc/default/spamassassin](https://github.com/ajgon/DeeDee/blob/master/etc/default/spamassassin) Needs Edit
* [/etc/spamassassin/local.cf](https://github.com/ajgon/DeeDee/blob/master/etc/spamassassin/local.cf)
* [/etc/spamassasin/v310.pre](https://github.com/ajgon/DeeDee/blob/master/etc/spamassasin/v310.pre)

Then:

    # As Root
    sa-update --no-gpg
    /etc/init.d/spamassassin start
    /etc/init.d/postfix restart

## RoundCube

    # As Root
    cd /home/htdocs/example.com/super/_ssl/public
    wget http://downloads.sourceforge.net/project/roundcubemail/roundcubemail/0.7.1/roundcubemail-0.7.1.tar.gz\?r\=http%3A%2F%2Fwww.roundcube.net%2Fdownload\&ts\=1330211473\&use_mirror\=freefr -O roundcubemail-0.7.1.tar.gz
    tar -xzvf roundcubemail-0.7.1.tar.gz
    mv roundcubemail-0.7.1 mail
    chown -Rv o-rwx mail
    chown -Rv www-data:www-data mail
    echo "suhosin.session.encrypt=Off" >> /etc/php5/fpm/conf.d/suhosin.ini
    mysql -u root -p

    -- In MySQL
    CREATE DATABASE roundcubemail /*!40101 CHARACTER SET utf8 COLLATE utf8_general_ci */;
    GRANT ALL PRIVILEGES ON roundcubemail.* TO roundcube@localhost IDENTIFIED BY '<password>';
    FLUSH PRIVILEGES;

    # As Root
    mysql roundcubemail < SQL/mysql.initial.sql

Now it's time for web part of the installation. Go to https://ssl.example.com/mail/installer/ and fill the form. Set SMTP server to tls://localhost. After finishing:

    # As Root
    chown www-data:www-data config/db.inc.php config/main.inc.php
    chmod 600 config/db.inc.php config/main.inc.php
    rm -rf installer/

# NFS

    # As Root
    apt-get install nfs-server
    mkdir -p /home/nfs/data /home/data

* [/etc/exports](https://github.com/ajgon/DeeDee/blob/master/etc/exports) Needs Edit
* [/etc/fstab](https://github.com/ajgon/DeeDee/blob/master/etc/fstab) Needs Edit

