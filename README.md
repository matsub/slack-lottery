# slack-lottery
Slackで使えるおみくじ。

1. 登録する
2. 叩く

# デプロイ方法
1. slack appを作る
2. OAuth & Permissionsからchat:write:botのscopeを設定
3. このリポジトリをFork
4. Forkしたリポジトリをソースに、Cloud Buildのトリガーを作成
5. OAuth & PermissionsからOAuth Access Tokenを取得
6. Cloud Buildの`Substitution variables`に`_SLACK_TOKEN`とう変数名でAccess Tokenを追加
7. slack app側に、ビルドされたCloud Functionsのエンドポイントを使ってslashcommandsを登録

おわり
