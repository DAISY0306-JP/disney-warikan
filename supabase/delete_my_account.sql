-- WARITABI: アプリの「アカウントを削除」で使う関数
-- Supabase の SQL Editor で一度だけ実行してください。
--
-- ログイン中のユーザー自身のアカウント（auth.users の行）を削除します。
-- 旅行データ（trips）は削除しません。共有しているほかのメンバーが引き続き使えるようにするためです。
-- trips などのテーブルが auth.users を外部キーで参照していて削除できない場合は、
-- その外部キーを ON DELETE CASCADE（参加情報）や ON DELETE SET NULL（作成者など）に変更してください。

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'ログインしてください。';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
