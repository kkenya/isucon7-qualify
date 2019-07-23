# isucon7-qualifyやったこと

### デフォルトのEditorをVimに変更

```bash
sudo update-alternatives --config editor
```

### shからbashに変更

```bash
$ echo $SHELL
/bin/sh
$ cat /etc/shells
# /etc/shells: valid login shells
/bin/sh
/bin/dash
/bin/bash
/bin/rbash
/usr/bin/tmux
/usr/bin/screen
$ sudo chsh -s /bin/bash isucon
$ grep isucon /etc/passwd
isucon:x:1002:1002::/home/isucon:/bin/bash
```

### systemdを確認

```bash
ll /etc/systemd/system/
sudo systemctl enable isuda.go isutar.go
```

## サーバー、mysql

- alpインストール
- slowquery設定

## mysql_config_editor

```bash
mysql_config_editor set --login-path=local --host=localhost --user=isucon --password
mysql_config_editor print --all
[local]
user = isucon
password = *****
host = localhost
$ mysql --login-path=local
```

[doc](https://dev.mysql.com/doc/refman/5.6/ja/mysql-config-editor.html)

## mysqlの確認

table, index確認

```mysql
mysql> show tables;
mysql> show index from channel;
mysql> show index from haveread;
mysql> show index from image;
mysql> show index from message;
mysql> show index from user;
```

## index追加

mysqldumpslowｓで確認した遅いクエリにindex追加

```sql
ALTER TABLE message ADD INDEX idx__channnel_id__id(channel_id, id);
ALTER TABLE image ADD INDEX idx__name(name);
ALTER TABLE haveread ADD INDEX idx__channel_id(channel_id);
ALTER TABLE user ADD INDEX idx__name(name);
```

score: 19053


## DB画像書き出し

[nodeでDBからディレクトリに画像を活気出すスクリプトを用意](https://github.com/kkenya/isucon7-qualify/commit/c2c743efb62c78cdd851dcccc1fe5cbebb796153)

```bash
node output_image.js
```

nginxで304を返す

```nginx.conf
server {
        ...
        root /home/isucon/isubata/webapp/public;

        location /favicon.ico {
                add_header Cache-Control "public max-age=86400";
        }
        location /fonts/ {
                add_header Cache-Control "public max-age=86400";
        }
        location /js/ {
                add_header Cache-Control "public max-age=86400";
        }
        location /css/ {
                add_header Cache-Control "public max-age=86400";
        }
        location /icons {
                add_header Cache-Control "public max-age=86400";
        }

        location / {
                proxy_set_header Host $http_host;
                proxy_pass http://127.0.0.1:5000;
        }

}
```

## 余分なカラム取得をしない

```git
- SELECT *
+ SELECT message_id
```

## N+1解消

- [message](https://github.com/kkenya/isucon7-qualify/commit/f6ba9b4230038d3c8af10a53654e41122741b8e5)
- [history](https://github.com/kkenya/isucon7-qualify/commit/cbe4f1f009fe1b85e42461a5ae4418ace4830302)
- [haveread](https://github.com/kkenya/isucon7-qualify/commit/3bdcd22bb72a571707b6366fa3840eb864ef854d)

## Redisを導入しカウントを保存する

nodeではioredisを利用

[messageのcountをredisに保存](https://github.com/kkenya/isucon7-qualify/commit/9e99387d5357c6a172119c28a880e3d8671b7192)

200822

ioredis利用
スコア倍増20000

## redisでCOUNT(*)を保持

haveread, messageのCOUNT(*)をmysqlからredisに保存

score: 10000 -> 9000
なぜか下がった
mysqlでサマリーテーブルでも良い？

## TODO

- [ ] どうやって302確認する
- [ ] 帯域が足りないのはどうやって気づく
- [ ] 3台構成を試す
- [ ] tmuxまとめる
- [ ] mysql, nginxをどうgit管理するか
- [ ] redisをinix socketに変更
- [ ] innodbのチューニング
- [ ] fetchのレスポンスタイムを調整

## 予選通過の実装を見て

|tearm|score|
|:--:|:--:|
|588,107|†空中庭園†《ガーデンプレイス》|
|522,461|スギャブロエックス|
|481,024|fujiwara組|
|383,085|予算ZERO|
|368,444|MSA|
|314,995|白金動物園|
|268,588|チーム新卒|
|266,585|takedashi|
|262,143|円山町|
|256,120|都営三田線東急目黒線直通急行日吉行[学生]|
|228,772|negainoido|
|221,823|ソン・モテメン・マサヨシ|

- †空中庭園†《ガーデンプレイス》
  - アップリケーション側で画像を提供
  - [画像ファイルをRedisに入れる](https://mozami.me/2017/10/24/isucon7_qualify.html)
  - unixsocketに変更
- スギャブロエックス
  - WebDAVに画像を保存しそれぞれのサーバーからアクセス
  - [3台構成でリクエストを振り分ける](https://kazeburo.hatenablog.com/entry/2017/10/23/181843)
    - isu701 - nginx(reverse proxy), app
    - isu702 - nginx(reverse proxy), app
    - isu703 - nginx(reverse proxy, webdav), mysql
  - それぞれのサーバーのNginxからETagを返した場合、値がずれる
  - テンプレートの処理を少なく
- fujiwara組
  - Session に user 情報を全部入れて DB を引かない(効果小)
  - [画像をアップロードされてきたサーバにそのまま保存し、保存時にどのサーバにあるかわかる情報をファイル名に入れてnginxでそれを元に画像があるサーバにproxy_passする](https://beatsync.net/main/log20171023.html)
- MSA
  - [nginxからtry_fileで存在しなかったら、もう片方にproxyする](https://mizkei.hatenablog.com/entry/2017/10/23/182820)
- 白金動物園
  - [blog](https://diary.sorah.jp/2017/10/23/isucon7q)
  - mysqlのtextをvarcharに変更
  - cacheはiconsのみに絞る
  - /fetch を HTTP long polling
  - テンプレートの処理を少なく

